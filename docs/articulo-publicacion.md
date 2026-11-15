---
title: "SmartInventory: un inventario que nunca se descuadra, con Couchbase Capella y CI/CD"
published: true
description: Cómo construimos y desplegamos un sistema de inventarios sobre Couchbase Capella, usando documentos JSON, SQL++ y transacciones ACID para que el stock nunca quede en negativo.
tags: nosql, couchbase, node, devops
---

# SmartInventory: un inventario que nunca se descuadra, con Couchbase Capella

Un inventario parece un problema sencillo: productos, entradas y salidas. Pero en cuanto se mira de cerca aparecen exigencias serias. El catálogo cambia de forma según el tipo de producto. El stock no puede quedar nunca en negativo, ni siquiera si dos personas registran una salida al mismo tiempo. Y cada cambio tiene que quedar auditado.

**SmartInventory** es una aplicación web full stack que resuelve eso sobre una sola base de datos NoSQL: **Couchbase Capella**, la versión gestionada en la nube de Couchbase. En este artículo contamos cómo la construimos, cómo la desplegamos de forma automática y qué aprendimos al probarla con escrituras concurrentes.

## Enlaces del proyecto

- **Repositorio público:** https://github.com/Stevien04/SmartInventory
- **Aplicación:** https://smartinventory-app.onrender.com
- **Estado de la API:** https://smartinventory-api-29jb.onrender.com/api/health
- **Video demostrativo (3 min):** https://youtu.be/g1ksH2ASxBw

> Los servicios están en el plan gratuito de Render: la primera petición después de un rato sin uso puede tardar unos 30 segundos mientras el servidor despierta.

---

## Video demostrativo

En 3 minutos: la arquitectura, la aplicación funcionando en Render, el rechazo de una salida sin stock, los documentos en Couchbase con una consulta SQL++ y el pipeline de CI/CD.

[![Video demostrativo de SmartInventory](https://img.youtube.com/vi/g1ksH2ASxBw/hqdefault.jpg)](https://youtu.be/g1ksH2ASxBw)

---

## 1. ¿Por qué Couchbase?

Necesitábamos tres cosas de la base de datos:

| Necesidad | Lo que ofrece Couchbase |
| --- | --- |
| Catálogo flexible, sin migraciones cada vez que cambia un producto | Documentos JSON sin esquema rígido |
| Leer un producto por su ID muy rápido | Acceso **clave-valor**: el ID es la clave del documento |
| Listar, filtrar y agregar sin aprender un lenguaje nuevo | **SQL++**, un SQL para JSON con `SELECT`, `WHERE`, `JOIN` y `GROUP BY` |
| Descontar stock y registrar el movimiento a la vez | **Transacciones ACID** sobre varios documentos |

Couchbase combina un almacén clave-valor y un motor de consultas sobre el mismo dato, así que no tuvimos que añadir una caché ni un segundo motor. **Capella** nos dio un clúster gratuito en la nube sin administrar servidores.

## 2. Arquitectura

```text
        [ Navegador: React 18 + Vite + Tailwind ]        Render Static Site
                          │  HTTPS + JWT
                          ▼
             [ API: Node.js + Express ]                   Render Web Service
                          │  SDK de Couchbase (TLS)
                          ▼
                 [ Couchbase Capella ]                    DBaaS
      bucket smartinventory › scope inventario
      usuarios · categorias · proveedores · productos · movimientos
```

En Couchbase, un **bucket** equivale a una base de datos, un **scope** a un esquema y una **collection** a una tabla. Usamos una colección por tipo de documento.

## 3. El modelo de documentos

Un producto es un documento JSON cuya clave es su propio ID:

```json
// clave: PROD-001   colección: productos
{
  "id": "PROD-001",
  "codigo": "SKU-KB-RGB",
  "nombre": "Teclado Mecánico RGB Industrial",
  "categoriaId": "CAT-001",
  "proveedorId": "PROV-001",
  "precioCompra": 45.0,
  "precioVenta": 79.9,
  "stockActual": 15,
  "stockMinimo": 5,
  "estado": "ACTIVO"
}
```

El campo `stockActual` **no se edita desde el catálogo**. Solo cambia a través de un movimiento, y cada movimiento guarda el antes y el después:

```json
// clave: MOV-1731638400000-a1b2c   colección: movimientos
{
  "productoId": "PROD-001",
  "tipo": "SALIDA",
  "cantidad": 2,
  "stockAnterior": 15,
  "stockPosterior": 13,
  "motivo": "Venta",
  "usuarioId": "USR-ADMIN-001",
  "creadoEn": "2026-11-14T21:00:00.000Z"
}
```

Así el historial completo se puede auditar y reconstruir.

## 4. Implementación

### 4.1 Conexión a Capella

```javascript
// backend/src/config/couchbase.js
cluster = await couchbase.connect(process.env.COUCHBASE_CONNECTION_STRING, {
  username: process.env.COUCHBASE_USERNAME,
  password: process.env.COUCHBASE_PASSWORD,
  configProfile: 'wanDevelopment' // tiempos de espera pensados para conectarse por Internet
});
bucket = cluster.bucket('smartinventory');
await bucket.waitUntilReady(10000);
scope = bucket.scope('inventario');
```

La cadena de conexión empieza por `couchbases://` (con **s**): el tráfico entre Render y Capella va cifrado con TLS.

### 4.2 Clave-valor para leer, SQL++ para listar

Leer un producto por ID no necesita consultas ni índices:

```javascript
const { content } = await scope.collection('productos').get('PROD-001');
```

Para listar y filtrar usamos SQL++. El repositorio arma la consulta a partir de un filtro y **siempre usa parámetros**, nunca concatena valores:

```javascript
// SELECT d.* FROM `productos` AS d WHERE d.`estado` = $estado ORDER BY d.`nombre` ASC
const resultado = await scope.query(sql, {
  parameters: { estado: 'ACTIVO' },
  scanConsistency: couchbase.QueryScanConsistency.RequestPlus
});
```

`RequestPlus` hace que la consulta espere a que los índices incluyan las últimas escrituras. Sin eso, un producto recién creado podría no aparecer en el listado durante unos milisegundos, porque los índices se actualizan de forma asíncrona.

SQL++ también permite reportes que en otras bases NoSQL exigirían varias consultas. Por ejemplo, el valor del inventario por categoría, con un `JOIN` entre colecciones:

```sql
SELECT c.nombre AS categoria,
       SUM(p.stockActual) AS unidades,
       SUM(p.stockActual * p.precioCompra) AS valorCompra
FROM productos AS p
JOIN categorias AS c ON KEYS p.categoriaId
WHERE p.estado = "ACTIVO"
GROUP BY c.nombre
ORDER BY valorCompra DESC;
```

Los índices que usan estas consultas se crean con un script (`npm run db:init`) o desde el editor de consultas de Capella:

```sql
CREATE INDEX idx_productos_estado_nombre IF NOT EXISTS ON productos(estado, nombre);
CREATE INDEX idx_movimientos_producto_fecha IF NOT EXISTS ON movimientos(productoId, creadoEn DESC);
```

### 4.3 El stock nunca queda en negativo: transacciones ACID

La regla de negocio vive en una función pura, fácil de probar:

```javascript
// backend/src/services/stockService.js
if (tipo === 'SALIDA') {
  if (actual < cant) {
    throw new ErrorNegocio(`Stock insuficiente: disponible ${actual}, solicitado ${cant}.`);
  }
  nuevoStock = actual - cant;
}
```

Y la escritura se hace dentro de una **transacción ACID de Couchbase**, para que el stock del producto y el documento del movimiento se guarden juntos:

```javascript
await cluster.transactions().run(async (ctx) => {
  const doc = await ctx.get(productos, productoId);
  const calculo = validarYCalcularNuevoStock(doc.content.stockActual, tipo, cantidad);

  await ctx.replace(doc, { ...doc.content, stockActual: calculo.stockPosterior });
  await ctx.insert(movimientos, movimiento.id, movimiento);
});
```

Si la validación falla, o si falla cualquiera de las dos escrituras, la transacción se revierte: nunca queda un movimiento registrado con el stock sin actualizar, ni al revés.

## 5. La prueba que nos enseñó algo: escrituras concurrentes

Quisimos comprobar qué pasa si **tres personas registran a la vez una salida del mismo producto**. Lanzamos tres peticiones simultáneas contra un Couchbase real: salidas de 3 unidades sobre un producto con 5 en stock. Lo correcto es que solo una se aplique.

**Primer intento:** el stock final fue correcto (2 unidades, nunca negativo), pero las dos peticiones que perdieron la carrera devolvieron un error 500:

```text
[ '201 ok',
  '500 unable to create staged replace ec="cas_mismatch (9)"',
  '500 unable to create staged replace ec="cas_mismatch (9)"' ]
```

Couchbase protege cada documento con un **CAS** (*compare-and-swap*): un número de versión que cambia con cada escritura. Cuando dos transacciones leen la misma versión del producto y ambas intentan reemplazarlo, solo la primera lo consigue; la segunda detecta que el CAS ya no coincide. Es **control de concurrencia optimista**: no se bloquea nada, y el conflicto se detecta al escribir.

La integridad estaba garantizada, pero para el usuario un 500 no es una buena respuesta. La solución fue **repetir la transacción ante un conflicto**: al repetirla, vuelve a leer el stock ya actualizado y aplica la regla de negocio sobre el dato real. Los errores de negocio (como "stock insuficiente") no se repiten.

```javascript
for (let intento = 1; ; intento++) {
  try {
    return await ejecutarTransaccion(fn);
  } catch (error) {
    const esConflicto = !error.status && /cas_mismatch|TransactionFailed/i.test(`${error.name} ${error.message}`);
    if (!esConflicto || intento >= 5) throw error;
    await esperar(20 * intento + Math.random() * 50); // pequeña espera aleatoria
  }
}
```

**Segundo intento**, con el mismo experimento:

```text
[ '201 ok',
  '400 Stock insuficiente: disponible 2, solicitado 3. No se permite stock negativo.',
  '400 Stock insuficiente: disponible 2, solicitado 3. No se permite stock negativo.' ]
```

Y con tres **entradas** simultáneas de 4 unidades sobre un stock de 2, las tres se aplicaron y el stock final fue exactamente 14: ninguna actualización se perdió.

La lección: una transacción ACID garantiza que los datos no se corrompan, pero **la aplicación tiene que decidir qué hacer con los conflictos**.

## 6. Diseñado para no caerse

El backend tiene un **repositorio** como punto único de acceso a los datos, con dos implementaciones de la misma interfaz:

- `couchbaseStore.js`: Couchbase Capella, en producción.
- `memoria.js`: un almacén en memoria con los mismos datos de ejemplo.

Si las variables de Couchbase no están configuradas, la API arranca igual con el almacén en memoria, y `/api/health` lo indica. Esto nos permitió desarrollar el frontend sin conexión a la nube y ejecutar las pruebas de la API en GitHub Actions sin credenciales.

## 7. CI/CD con GitHub Actions y Render

Cada push a `main` ejecuta el workflow `.github/workflows/deploy.yml`:

1. Instala las dependencias del backend y ejecuta las pruebas: reglas de stock, niveles de alerta y pruebas de la API completa (login, crear producto, entradas, salidas, salida rechazada, alertas y que las consultas SQL++ vayan parametrizadas).
2. Compila el frontend con Vite.
3. **Solo si todo pasa**, llama a los deploy hooks de Render para desplegar el backend (Web Service) y el frontend (Static Site).

Las credenciales de Capella nunca están en el repositorio: son variables de entorno del Web Service en Render. Las URLs de los deploy hooks se guardan como secrets de GitHub.

## 8. Cómo probarlo

```bash
git clone https://github.com/Stevien04/SmartInventory.git
cd SmartInventory/backend
cp .env.example .env     # completar las variables COUCHBASE_*
npm install
npm run db:init          # scope, colecciones e índices
npm run seed             # datos de ejemplo
npm run dev
```

Usuario de prueba: `admin@smartinventory.com` / `Admin2026*!`. Sin credenciales de Couchbase, la API funciona igual con datos en memoria.

## 9. Limitaciones y siguientes pasos

- El plan gratuito de Capella es un clúster de un solo nodo, así que las transacciones usan durabilidad `none`. Con réplicas, basta con cambiar `COUCHBASE_TX_DURABILITY=majority` para que cada transacción espere la confirmación de la mayoría.
- Los listados recorren el catálogo completo; con miles de productos convendría paginar.
- El reporte por categoría con `JOIN` está en el archivo de consultas, pero todavía no tiene una pantalla propia en la aplicación.

## 10. Conclusiones

Una sola base de datos NoSQL bien elegida fue suficiente. Couchbase nos dio la flexibilidad de los documentos JSON, la velocidad del acceso clave-valor, la comodidad de SQL++ y la garantía de las transacciones ACID. La prueba de concurrencia fue la parte más valiosa: confirmó que el stock no se descuadra y nos obligó a manejar los conflictos de forma explícita en lugar de devolver errores al usuario.

El código completo, con las instrucciones para desplegarlo, está en el [repositorio público](https://github.com/Stevien04/SmartInventory).

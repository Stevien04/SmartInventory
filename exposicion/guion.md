# Guion de exposición — SmartInventory

Cada paso dice **qué mostrar** en pantalla y **qué decir** mientras se ve. El texto sigue el orden de lo que aparece en cada diapositiva.

Duración aproximada: 9 minutos. Si tienes menos tiempo, omite los pasos 5 y 8.

---

## Antes de exponer

### 1. Deja cinco pestañas, en este orden

| Pestaña | Qué abrir | Atajo |
|---|---|---|
| 1 | `exposicion/slides.html` (doble clic sobre el archivo) | `Ctrl + 1` |
| 2 | `https://smartinventory-app.onrender.com` | `Ctrl + 2` |
| 3 | `https://smartinventory-api-29jb.onrender.com/api/health` | `Ctrl + 3` |
| 4 | `https://cloud.couchbase.com` → tu clúster → **Data Tools** | `Ctrl + 4` |
| 5 | `https://github.com/Stevien04/SmartInventory/actions` | `Ctrl + 5` |

Cierra todas las demás pestañas.

### 2. Pon el navegador en pantalla completa

Pulsa `F11`. Desaparecen las pestañas y la barra de direcciones. Los atajos `Ctrl + 1` a `Ctrl + 5` siguen funcionando.

### 3. Aprende a mover las diapositivas

Se ve una sola diapositiva a la vez:

- `→` o `Espacio`: siguiente.
- `←`: anterior.
- Teclas `1` a `9`: salta directo a esa diapositiva (la 10 y la 11 se alcanzan con `→`).

### 4. Despierta la aplicación

Abre las pestañas 2 y 3 unos dos minutos antes. El servidor gratuito de Render se duerme y la primera carga tarda cerca de un minuto.

En la pestaña 3 comprueba que `database.estado` diga `CONNECTED`. En la pestaña 4, inicia sesión en Capella y comprueba que el clúster esté activo: los clústeres gratuitos se pausan tras un tiempo sin uso. Si aparece pausado, reanúdalo, espera a que esté listo y reinicia la API en Render (**Manual Deploy → Deploy latest commit**), porque el backend solo conecta con Couchbase al arrancar.

### 5. Prepara los datos de la demo

Entra a la aplicación y anota, en **Productos**, un producto con poco stock y su cantidad exacta. Lo usarás para provocar el rechazo por stock insuficiente.

---

## Guion paso a paso

### Paso 1 — Portada · 30 s

**MOSTRAR:** pestaña 1, diapositiva 1 (pulsa `1`).

**DECIR:**
> Buenos días. Voy a presentar SmartInventory, un sistema web de gestión y control de inventarios construido sobre una base de datos NoSQL documental en la nube: Couchbase Capella.

---

### Paso 2 — Problema y objetivo · 40 s

**MOSTRAR:** pulsa `→`. Diapositiva 2, con tres tarjetas numeradas.

**DECIR:**
> El sistema resuelve tres cosas. Primero, el control de existencias: el stock solo cambia mediante entradas, salidas y ajustes, y nunca puede quedar en negativo. Segundo, las alertas automáticas: cada producto se clasifica como normal, con stock bajo o agotado. Y tercero, el acceso por roles: hay un administrador y un almacenero, con sesión por token JWT.

---

### Paso 3 — Couchbase Capella · 50 s

**MOSTRAR:** pulsa `→`. Diapositiva 3, con cuatro tarjetas.

**DECIR:**
> Elegimos Couchbase porque en una sola base de datos nos da cuatro capacidades. Documentos JSON, para un catálogo flexible. Acceso clave-valor: el ID del producto es la clave del documento, así que leerlo no necesita consultas. SQL++, un SQL para JSON, para listados, filtros y reportes. Y transacciones ACID, para que el stock y el movimiento se guarden juntos.

---

### Paso 4 — Arquitectura · 40 s

**MOSTRAR:** pulsa `→`. Diapositiva 4, con tres capas de arriba abajo.

**DECIR:**
> La arquitectura tiene tres capas. Arriba, el frontend en React, publicado en Render como sitio estático. En el medio, el backend: una API REST en Node.js y Express, que valida las reglas de negocio y los roles. Y abajo, Couchbase Capella, con un bucket, un scope y cinco colecciones. El backend se conecta con el SDK de Couchbase por una conexión cifrada; el navegador nunca habla directamente con la base de datos.

---

### Paso 5 — Modelo de documentos · 40 s

**MOSTRAR:** pulsa `→`. Diapositiva 5, con dos documentos JSON.

**DECIR:**
> Hay dos documentos clave. A la izquierda, el producto, que guarda el stock actual y el stock mínimo; su ID es la clave del documento. A la derecha, el movimiento, que guarda la historia: el tipo, la cantidad, y el stock anterior y posterior. Con eso se puede auditar cualquier cambio de existencias.

---

### Paso 6 — Movimiento atómico y alertas · 50 s

**MOSTRAR:** pulsa `→`. Diapositiva 6, con cuatro cajas en fila y tres niveles debajo.

**DECIR:**
> Esta es la regla de negocio central. Cuando se registra un movimiento, primero se valida: una salida no puede superar el stock disponible. Después, en una transacción ACID de Couchbase, se actualiza el stock y se guarda el movimiento; o se guardan los dos o ninguno. Si otro usuario cambió el mismo producto en ese instante, la operación se repite con el dato nuevo. Abajo están los tres niveles de alerta: agotado, stock bajo y normal.

---

### Paso 7 — SQL++ y concurrencia · 45 s

**MOSTRAR:** pulsa `→`. Diapositiva 7, con dos tarjetas.

**DECIR:**
> A la izquierda, una consulta SQL++: los productos activos cuyo stock está en el mínimo o por debajo. Se lee igual que SQL, pero trabaja sobre documentos JSON. A la derecha, cómo se manejan dos escrituras a la vez: cada documento tiene una versión llamada CAS. Si otro proceso cambió el producto, Couchbase detecta el conflicto y la API repite la transacción.

---

### Paso 8 — Prueba de concurrencia · 35 s

**MOSTRAR:** pulsa `→`. Diapositiva 8, con cuatro filas.

**DECIR:**
> Lo probamos con un Couchbase real. Con 5 unidades en stock, lanzamos tres salidas de 3 unidades al mismo tiempo. Una se aplicó y dejó el stock en 2; las otras dos se repitieron, leyeron el stock nuevo y fueron rechazadas por stock insuficiente. Y con tres entradas simultáneas, las tres se sumaron: no se perdió ninguna.

---

### Paso 9 — Entrada a la demo · 10 s

**MOSTRAR:** pulsa `→`. Diapositiva 9, con cinco pasos.

**DECIR:**
> Veamos la aplicación funcionando, en estos cinco pasos.

---

### Paso 10 — Demo en la aplicación · 2 min

**MOSTRAR:** pulsa `Ctrl + 2` para ir a la aplicación.

1. En la pantalla de inicio, pulsa **Iniciar sesión** (el correo y la contraseña del administrador ya vienen escritos).
2. En el **Dashboard**, señala los indicadores y las alertas de stock.
3. En el menú de la izquierda, haz clic en **Movimientos**.
4. Elige el producto que anotaste, tipo **SALIDA**, y escribe una cantidad **mayor** a su stock. Regístralo. Debe aparecer el error «Stock insuficiente… No se permite stock negativo».
5. Cambia la cantidad a una **válida**, escribe el motivo `Venta de demostración` y regístralo.
6. Vuelve al **Dashboard** y señala que los indicadores cambiaron.

**DECIR:**
> Esta es la aplicación publicada en Render. Inicio sesión como administrador. El dashboard muestra los productos activos, las unidades totales y las alertas. Voy a Movimientos e intento una salida mayor al stock disponible: el sistema la rechaza y no guarda nada. Ahora registro una salida válida: se actualiza el stock, se guarda el movimiento y el dashboard refleja el cambio.

---

### Paso 11 — Los documentos en Capella · 1 min

**MOSTRAR:** pulsa `Ctrl + 4` para ir a Capella.

1. En **Data Tools → Documents**, elige el bucket `smartinventory`, el scope `inventario` y la colección `movimientos`. Abre el movimiento más reciente.
2. Ve a **Query**, con el contexto `smartinventory` / `inventario`, pega esta consulta y pulsa **Run**:

```sql
SELECT p.codigo, p.nombre, p.stockActual, p.stockMinimo
FROM productos AS p
WHERE p.estado = "ACTIVO" AND p.stockActual <= p.stockMinimo;
```

**DECIR:**
> Aquí está, en Couchbase Capella, el movimiento que acabo de registrar, con el stock anterior y el posterior. Y con SQL++ consulto directamente en la base los productos que están en alerta.

---

### Paso 12 — CI/CD · 50 s

**MOSTRAR:** pulsa `Ctrl + 1` y avanza con `→` hasta la diapositiva 10. Después pulsa `Ctrl + 5` para mostrar GitHub Actions y abre la ejecución más reciente.

**DECIR:**
> El despliegue está automatizado con GitHub Actions. Cada push a la rama main ejecuta doce pruebas: las reglas de stock, los niveles de alerta y la API completa. Luego compila el frontend. Solo si todo pasa, se despliegan la API y el frontend en Render. Las credenciales de Capella no están en el código: son variables de entorno en Render.

---

### Paso 13 — Conclusiones · 30 s

**MOSTRAR:** pulsa `Ctrl + 1` y avanza con `→` hasta la diapositiva 11.

**DECIR:**
> En conclusión, una sola base NoSQL bien elegida fue suficiente: Couchbase nos dio documentos flexibles, lecturas directas por clave, consultas en SQL++ y transacciones que impiden que el inventario se descuadre. En pantalla están el repositorio, la aplicación y el estado de la API. Muchas gracias. ¿Tienen alguna pregunta?

---

## Resumen para tener a la vista

| Paso | Pestaña | Qué se ve | Tiempo |
|---|---|---|---|
| 1 | 1 | Diapositiva 1: portada | 0:30 |
| 2 | 1 | Diapositiva 2: problema y objetivo | 0:40 |
| 3 | 1 | Diapositiva 3: Couchbase Capella | 0:50 |
| 4 | 1 | Diapositiva 4: arquitectura | 0:40 |
| 5 | 1 | Diapositiva 5: documentos | 0:40 |
| 6 | 1 | Diapositiva 6: movimiento y alertas | 0:50 |
| 7 | 1 | Diapositiva 7: SQL++ y concurrencia | 0:45 |
| 8 | 1 | Diapositiva 8: prueba de concurrencia | 0:35 |
| 9 | 1 | Diapositiva 9: entrada a la demo | 0:10 |
| 10 | 2 | App: sesión, rechazo y salida válida | 2:00 |
| 11 | 4 | Capella: documento y consulta SQL++ | 1:00 |
| 12 | 1 y 5 | Diapositiva 10 y GitHub Actions | 0:50 |
| 13 | 1 | Diapositiva 11: conclusiones | 0:30 |

---

## Preguntas probables

**¿Por qué Couchbase y no otra base NoSQL?**
> Porque en un solo motor tiene lo que necesitábamos: documentos JSON flexibles, lectura directa por clave, consultas en SQL++ y transacciones ACID entre varios documentos. Así no hizo falta añadir una caché ni un segundo motor.

**¿Qué es SQL++?**
> Es el lenguaje de consultas de Couchbase. Tiene SELECT, WHERE, JOIN y GROUP BY como SQL, pero trabaja sobre documentos JSON.

**¿Cómo se evita el stock negativo?**
> La validación ocurre en el backend, dentro de la misma transacción que actualiza el stock y guarda el movimiento. Si la salida supera el stock, la transacción se cancela y no se guarda nada.

**¿Y si dos personas registran una salida a la vez?**
> Cada documento tiene una versión, el CAS. Si dos transacciones intentan cambiar el mismo producto, Couchbase solo deja pasar la primera; la API repite la segunda, que lee el stock nuevo y aplica la regla sobre el dato real. Lo comprobamos con tres salidas simultáneas.

**¿Qué pasa si Couchbase no está disponible?**
> Si la API arranca sin credenciales o sin conexión, usa un almacén en memoria con datos de ejemplo y la ruta `/api/health` lo indica. En producción, la fuente de verdad es Couchbase Capella.

**¿Qué prueban las pruebas automáticas?**
> Son doce: las reglas de stock y de alertas, y pruebas de la API completa: inicio de sesión, crear un producto, código repetido, entradas, salidas, salida rechazada, alertas, y que las consultas SQL++ vayan parametrizadas.

**¿Qué diferencia hay entre el administrador y el almacenero?**
> El almacenero consulta productos, registra movimientos y revisa alertas. El administrador, además, gestiona el catálogo y los usuarios.

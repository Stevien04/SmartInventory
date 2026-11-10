# Guion de exposición — SmartInventory

Cada paso dice **qué mostrar** en pantalla y **qué decir** mientras se ve. El texto sigue el orden de lo que aparece en cada diapositiva.

Duración aproximada: 9 minutos. Si tienes menos tiempo, omite los pasos 5 y 7.

---

## Antes de exponer

### 1. Deja cinco pestañas, en este orden

| Pestaña | Qué abrir | Atajo |
|---|---|---|
| 1 | `exposicion/slides.html` (doble clic sobre el archivo) | `Ctrl + 1` |
| 2 | `https://smartinventory-app.onrender.com` | `Ctrl + 2` |
| 3 | `https://smartinventory-api-29jb.onrender.com/metrics` | `Ctrl + 3` |
| 4 | `https://console.neo4j.io` → menú **Query** | `Ctrl + 4` |
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

En la pestaña 4, inicia sesión en la consola de Neo4j y comprueba que la instancia `Instance01` diga «Running». Las instancias gratuitas se pausan tras unos días sin uso: si aparece pausada, pulsa «···» → «Resume Instance» y espera un minuto.

### 5. Prepara los datos de la demo

Entra a la aplicación y anota, en **Productos**, un producto con poco stock y su cantidad exacta. Lo usarás para provocar el rechazo por stock insuficiente.

---

## Guion paso a paso

### Paso 1 — Portada · 30 s

**MOSTRAR:** pestaña 1, diapositiva 1 (pulsa `1`).

**DECIR:**
> Buenos días. Voy a presentar SmartInventory, un sistema web de gestión y control de inventarios. Su particularidad es que no usa una sola base de datos, sino varios motores NoSQL, cada uno para una tarea distinta. A eso se le llama persistencia políglota.

---

### Paso 2 — Problema y objetivo · 40 s

**MOSTRAR:** pulsa `→`. Diapositiva 2, con tres tarjetas numeradas.

**DECIR:**
> El sistema resuelve tres cosas. Primero, el control de existencias: el stock solo cambia mediante entradas, salidas y ajustes, y nunca puede quedar en negativo. Segundo, las alertas automáticas: cada producto se clasifica como normal, con stock bajo o agotado. Y tercero, el acceso por roles: hay un administrador y un almacenero, con sesión por token JWT.

---

### Paso 3 — Persistencia políglota · 50 s

**MOSTRAR:** pulsa `→`. Diapositiva 3, con cuatro tarjetas, una por motor.

**DECIR:**
> Estos son los cuatro motores, de izquierda a derecha. MongoDB Atlas es la base documental: guarda el catálogo de productos, los usuarios y los movimientos. Redis Cloud es un almacén clave-valor y se usa como caché del resumen del dashboard. Neo4j AuraDB es una base de grafos, para las relaciones entre proveedores, productos y categorías. Y Prometheus guarda series de tiempo: las métricas del sistema.

---

### Paso 4 — Arquitectura · 40 s

**MOSTRAR:** pulsa `→`. Diapositiva 4, con tres capas de arriba abajo.

**DECIR:**
> La arquitectura tiene tres capas. Arriba, el frontend en React, publicado en Render como sitio estático. En el medio, el backend: una API REST en Node.js y Express, que valida las reglas de negocio y los roles. Y abajo, los datos: el backend tiene un cliente para cada motor. El navegador nunca habla directamente con las bases de datos.

---

### Paso 5 — Modelo de documentos · 40 s

**MOSTRAR:** pulsa `→`. Diapositiva 5, con dos documentos JSON.

**DECIR:**
> En MongoDB hay dos documentos clave. A la izquierda, el producto, que guarda el stock actual y el stock mínimo. A la derecha, el movimiento, que guarda la historia: el tipo, la cantidad, y el stock anterior y posterior. Con eso se puede auditar cualquier cambio de existencias.

---

### Paso 6 — Movimiento atómico y alertas · 50 s

**MOSTRAR:** pulsa `→`. Diapositiva 6, con cuatro cajas en fila y tres niveles debajo.

**DECIR:**
> Esta es la regla de negocio central. Cuando se registra un movimiento, primero se valida: una salida no puede superar el stock disponible. Después, en una transacción, se actualiza el stock y se guarda el movimiento; o se guardan los dos o ninguno. Luego se borra la caché del dashboard y se cuenta la operación en las métricas. Abajo están los tres niveles de alerta: agotado, stock bajo y normal.

---

### Paso 7 — Redis y Neo4j · 45 s

**MOSTRAR:** pulsa `→`. Diapositiva 7, con dos tarjetas.

**DECIR:**
> A la izquierda, la caché. Si el resumen del dashboard ya está guardado, se responde desde ahí; si no, se calcula en MongoDB y se guarda sesenta segundos. Cada movimiento borra esa clave, para no mostrar datos viejos. A la derecha, el grafo: al crear un producto se sincroniza un nodo con su proveedor y su categoría, lo que permite preguntar qué suministra cada proveedor.

---

### Paso 8 — Observabilidad · 35 s

**MOSTRAR:** pulsa `→`. Diapositiva 8, con cuatro métricas.

**DECIR:**
> El sistema informa de su propio estado con cuatro métricas: el total de movimientos por tipo y resultado, la latencia de cada ruta de la API, y cuántos productos están en stock bajo o agotados. Ahora las veremos en vivo.

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

### Paso 11 — Demo de métricas · 30 s

**MOSTRAR:** pulsa `Ctrl + 3` y recarga con `F5`.

1. Pulsa `Ctrl + F` y busca `smartinventory_movimientos_total`.
2. Señala la línea con `estado="EXITOSO"` y la de `estado="FALLIDO"`.

**DECIR:**
> Este es el punto de métricas. Aquí está el contador de movimientos: la salida que acabo de registrar aparece como exitosa, y el intento rechazado, como fallido.

---

### Paso 12 — Demo del grafo · 40 s

**MOSTRAR:** pulsa `Ctrl + 4` para ir a la consola de Neo4j, en **Query**.

1. Pega esta consulta y pulsa **Run**:

```
MATCH (prov:Proveedor)-[:SUMINISTRA]->(p:Producto)-[:PERTENECE_A]->(c:Categoria) RETURN prov, p, c
```

2. Señala los nodos: proveedores, productos y categorías, unidos por flechas.

**DECIR:**
> Este es el grafo de suministro en Neo4j AuraDB. Cada producto está unido a su proveedor por la relación «suministra» y a su categoría por «pertenece a». El backend lo mantiene sincronizado con el catálogo de MongoDB. Aquí se puede preguntar, por ejemplo, qué productos dependen de un mismo proveedor.

---

### Paso 13 — CI/CD · 50 s

**MOSTRAR:** pulsa `Ctrl + 1` y avanza con `→` hasta la diapositiva 10. Después pulsa `Ctrl + 5` para mostrar GitHub Actions y abre la ejecución más reciente.

**DECIR:**
> El despliegue está automatizado con GitHub Actions. Cada push a la rama main ejecuta las pruebas unitarias del backend, que verifican el cálculo de stock y los niveles de alerta, y compila el frontend. Solo si todo pasa, se despliegan la API y el frontend en Render. Aquí se ven las ejecuciones en el repositorio público.

---

### Paso 14 — Conclusiones · 30 s

**MOSTRAR:** pulsa `Ctrl + 1` y avanza con `→` hasta la diapositiva 11.

**DECIR:**
> En conclusión, SmartInventory muestra que no hace falta elegir un único motor NoSQL: cada uno resuelve bien un problema distinto, y el backend los coordina. En pantalla están el repositorio, la aplicación y las métricas. Muchas gracias. ¿Tienen alguna pregunta?

---

## Resumen para tener a la vista

| Paso | Pestaña | Qué se ve | Tiempo |
|---|---|---|---|
| 1 | 1 | Diapositiva 1: portada | 0:30 |
| 2 | 1 | Diapositiva 2: problema y objetivo | 0:40 |
| 3 | 1 | Diapositiva 3: los cuatro motores | 0:50 |
| 4 | 1 | Diapositiva 4: arquitectura | 0:40 |
| 5 | 1 | Diapositiva 5: documentos | 0:40 |
| 6 | 1 | Diapositiva 6: movimiento y alertas | 0:50 |
| 7 | 1 | Diapositiva 7: caché y grafo | 0:45 |
| 8 | 1 | Diapositiva 8: métricas | 0:35 |
| 9 | 1 | Diapositiva 9: entrada a la demo | 0:10 |
| 10 | 2 | App: sesión, rechazo y salida válida | 2:00 |
| 11 | 3 | `/metrics`: contador de movimientos | 0:30 |
| 12 | 4 | Neo4j: grafo de suministro | 0:40 |
| 13 | 1 y 5 | Diapositiva 10 y GitHub Actions | 0:50 |
| 14 | 1 | Diapositiva 11: conclusiones | 0:30 |

---

## Estado en producción

Los cuatro motores están conectados en la nube. La comprobación de estado de la API (`/api/health`) responde:

| Motor | Estado | Servicio |
|---|---|---|
| MongoDB | `CONNECTED` | MongoDB Atlas |
| Redis | `CONNECTED` | Redis Cloud, base `smartinventory-cache` (plan gratuito) |
| Neo4j | `CONNECTED` | Neo4j AuraDB, instancia `Instance01` (plan gratuito) |
| Prometheus | `ACTIVE (/metrics)` | Métricas expuestas por el backend |

Si quieres mostrar la evidencia, abre `https://smartinventory-api-29jb.onrender.com/api/health` en una pestaña.

Dos cuidados para el día de la exposición:

1. **Neo4j se pausa solo.** Las instancias gratuitas de AuraDB se pausan tras unos días sin uso y se borran tras 30 días de inactividad. Entra a la consola ese día y reanúdala si hace falta. Después reinicia la API en Render (**Manual Deploy → Deploy latest commit**): el backend solo conecta con Neo4j al arrancar.
2. **Comprueba el estado antes de empezar.** Si `/api/health` no muestra `CONNECTED` en Redis o en Neo4j, no afirmes que están en la nube: el backend sigue funcionando con una caché en memoria y sin grafo, y eso es lo que debes decir.

---

## Preguntas probables

**¿Por qué varios motores y no solo MongoDB?**
> Porque cada tipo de dato tiene un motor que lo maneja mejor. Los documentos van bien en MongoDB; una lectura repetida y costosa se acelera con una caché clave-valor; las relaciones entre proveedores y productos se consultan mejor en un grafo; y las métricas son series de tiempo.

**¿Qué pasa si Redis se cae?**
> El backend sigue funcionando: usa una caché en memoria como respaldo y, si tampoco hay dato, consulta MongoDB. La caché acelera, pero no es la fuente de verdad.

**¿Redis y Neo4j están desplegados en la nube?**
> Sí. La caché está en Redis Cloud y el grafo en Neo4j AuraDB, ambos en su plan gratuito. Se puede comprobar en la ruta de estado de la API, que muestra los cuatro motores conectados.

**¿Cómo se evita el stock negativo?**
> La validación ocurre en el backend, dentro de la misma transacción que actualiza el stock y guarda el movimiento. Si la salida supera el stock, la transacción se cancela y no se guarda nada.

**¿Qué prueban las pruebas automáticas?**
> Son seis pruebas unitarias: que una entrada suma, que una salida permitida resta, que una salida mayor al stock se rechaza, y los tres niveles de alerta.

**¿Qué diferencia hay entre el administrador y el almacenero?**
> El almacenero consulta productos, registra movimientos y revisa alertas. El administrador, además, gestiona usuarios.

# Guion de exposición — SmartInventory

Cada paso dice **qué mostrar** en pantalla y **qué decir** mientras se ve. El texto sigue el orden de lo que aparece en cada diapositiva.

Duración aproximada: 8 minutos. Si tienes menos tiempo, omite los pasos 5 y 7.

---

## Antes de exponer

### 1. Deja cuatro pestañas, en este orden

| Pestaña | Qué abrir | Atajo |
|---|---|---|
| 1 | `exposicion/slides.html` (doble clic sobre el archivo) | `Ctrl + 1` |
| 2 | `https://smartinventory-app.onrender.com` | `Ctrl + 2` |
| 3 | `https://smartinventory-api-29jb.onrender.com/metrics` | `Ctrl + 3` |
| 4 | `https://github.com/Stevien04/SmartInventory/actions` | `Ctrl + 4` |

Cierra todas las demás pestañas.

### 2. Pon el navegador en pantalla completa

Pulsa `F11`. Desaparecen las pestañas y la barra de direcciones. Los atajos `Ctrl + 1` a `Ctrl + 4` siguen funcionando.

### 3. Aprende a mover las diapositivas

Se ve una sola diapositiva a la vez:

- `→` o `Espacio`: siguiente.
- `←`: anterior.
- Teclas `1` a `9`: salta directo a esa diapositiva (la 10 y la 11 se alcanzan con `→`).

### 4. Despierta la aplicación

Abre las pestañas 2 y 3 unos dos minutos antes. El servidor gratuito de Render se duerme y la primera carga tarda cerca de un minuto.

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
> Estos son los cuatro motores, de izquierda a derecha. MongoDB es la base documental: guarda el catálogo de productos, los usuarios y los movimientos. Redis es un almacén clave-valor y se usa como caché del resumen del dashboard. Neo4j es una base de grafos, para las relaciones entre proveedores, productos y categorías. Y Prometheus guarda series de tiempo: las métricas del sistema.

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

### Paso 12 — CI/CD · 50 s

**MOSTRAR:** pulsa `Ctrl + 1` y avanza con `→` hasta la diapositiva 10. Después pulsa `Ctrl + 4` para mostrar GitHub Actions y abre la ejecución más reciente.

**DECIR:**
> El despliegue está automatizado con GitHub Actions. Cada push a la rama main ejecuta las pruebas unitarias del backend, que verifican el cálculo de stock y los niveles de alerta, y compila el frontend. Solo si todo pasa, se despliegan la API y el frontend en Render. Aquí se ven las ejecuciones en el repositorio público.

---

### Paso 13 — Conclusiones · 30 s

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
| 12 | 1 y 4 | Diapositiva 10 y GitHub Actions | 0:50 |
| 13 | 1 | Diapositiva 11: conclusiones | 0:30 |

---

## Lo que debes saber antes de exponer

Hoy, en producción, **solo MongoDB y Prometheus están realmente conectados**. La comprobación de estado de la API (`/api/health`) responde:

| Motor | Estado en producción | Qué significa |
|---|---|---|
| MongoDB | `CONNECTED` | Los datos se guardan de verdad en MongoDB Atlas |
| Prometheus | `ACTIVE (/metrics)` | Las métricas se exponen y se pueden consultar |
| Redis | `IN_MEMORY_FALLBACK` | No hay un servidor Redis conectado; la caché vive en la memoria del backend |
| Neo4j | `STANDBY/LOCAL` | No hay una base Neo4j conectada; la sincronización del grafo no se ejecuta |

Por eso el guion describe Redis y Neo4j por lo que hace el código, sin afirmar que haya un Redis Cloud o un Neo4j AuraDB en producción, y no incluye mostrar el navegador de Neo4j.

Tienes dos caminos:

1. **Conectarlos antes de exponer.** Crea una base gratuita en Redis Cloud y otra en Neo4j AuraDB, y agrega en Render las variables `REDIS_URL`, `NEO4J_URI`, `NEO4J_USERNAME` y `NEO4J_PASSWORD`. Cuando `/api/health` muestre `CONNECTED` en los cuatro, puedes decir que todo corre en la nube.
2. **Exponer tal como está y decirlo con claridad.** Si preguntan, la respuesta honesta está abajo.

Ten en cuenta también que el indicador de origen del dashboard dice «Redis In-Memory Cache» aunque la caché esté en la memoria del backend. No lo presentes como prueba de que hay un Redis conectado.

---

## Preguntas probables

**¿Por qué varios motores y no solo MongoDB?**
> Porque cada tipo de dato tiene un motor que lo maneja mejor. Los documentos van bien en MongoDB; una lectura repetida y costosa se acelera con una caché clave-valor; las relaciones entre proveedores y productos se consultan mejor en un grafo; y las métricas son series de tiempo.

**¿Qué pasa si Redis se cae?**
> El backend sigue funcionando: usa una caché en memoria como respaldo y, si tampoco hay dato, consulta MongoDB. La caché acelera, pero no es la fuente de verdad.

**¿Redis y Neo4j están desplegados en la nube?**
> La integración está implementada en el backend. En el despliegue actual, la caché usa la memoria del servidor como respaldo y el grafo no está conectado; MongoDB y las métricas sí están activos. Se puede comprobar en la ruta de estado de la API.

**¿Cómo se evita el stock negativo?**
> La validación ocurre en el backend, dentro de la misma transacción que actualiza el stock y guarda el movimiento. Si la salida supera el stock, la transacción se cancela y no se guarda nada.

**¿Qué prueban las pruebas automáticas?**
> Son seis pruebas unitarias: que una entrada suma, que una salida permitida resta, que una salida mayor al stock se rechaza, y los tres niveles de alerta.

**¿Qué diferencia hay entre el administrador y el almacenero?**
> El almacenero consulta productos, registra movimientos y revisa alertas. El administrador, además, gestiona usuarios.

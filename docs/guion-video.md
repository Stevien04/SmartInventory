# 🎬 Guion de Video: SmartInventory con Couchbase Capella (< 5 minutos)

**Duración objetivo:** 4:30 minutos (máximo permitido: 5:00)
**Plataforma:** YouTube / TikTok / Facebook
**Stack:** Couchbase Capella, Node.js + Express, React + Vite, GitHub Actions, Render

---

## ⏱️ Estructura

| Segmento | Tiempo | Bloque | Contenido |
| :---: | :---: | :--- | :--- |
| 1 | 0:00 – 0:30 | Problema y objetivo | Qué es SmartInventory y por qué el stock no puede descuadrarse |
| 2 | 0:30 – 1:15 | Arquitectura y Couchbase | React → Express → Couchbase Capella; bucket, scope y colecciones |
| 3 | 1:15 – 2:45 | Demo en vivo | Login, catálogo, salida rechazada, salida válida y alertas |
| 4 | 2:45 – 3:30 | Los datos en Capella | Documentos JSON y una consulta SQL++ en el Query Workbench |
| 5 | 3:30 – 4:30 | CI/CD y cierre | GitHub Actions → deploy en Render; `/api/health` conectado |

---

## 📝 Guion escena por escena

### Escena 1 — Problema y objetivo (0:00 – 0:30)
* **En pantalla:** portada de SmartInventory.
* **Voz:**
  > "Hola, les presentamos SmartInventory, un sistema web para controlar inventarios. La regla principal es simple: el stock nunca puede quedar en negativo, ni siquiera si dos personas registran una salida al mismo tiempo. Para lograrlo usamos una base de datos NoSQL en la nube: Couchbase Capella."

### Escena 2 — Arquitectura (0:30 – 1:15)
* **En pantalla:** diagrama React → API Express → Couchbase Capella, y la vista de colecciones en Capella.
* **Voz:**
  > "El frontend está hecho en React y el backend en Node.js con Express, ambos desplegados en Render. Los datos viven en Couchbase Capella: un bucket llamado smartinventory, un scope inventario y cinco colecciones: usuarios, categorías, proveedores, productos y movimientos. Cada documento es JSON y su clave es su propio ID, así que leer un producto es un acceso clave-valor directo."

### Escena 3 — Demo en vivo (1:15 – 2:45)
* **En pantalla:** `https://smartinventory-app.onrender.com`.
  1. Iniciar sesión con `admin@smartinventory.com`.
  2. Dashboard: productos activos, unidades, alertas.
  3. Movimientos: intentar una **salida mayor al stock** → aparece "Stock insuficiente".
  4. Registrar una salida válida → el stock baja y el producto pasa a **STOCK_BAJO**.
* **Voz:**
  > "Si intentamos despachar más unidades de las que hay, la API lo rechaza. Cuando la salida es válida, el stock del producto y el registro del movimiento se guardan en una única transacción ACID de Couchbase: o se guardan los dos, o ninguno. Y si dos usuarios mueven el mismo producto a la vez, Couchbase detecta el conflicto y la API repite la operación con el stock actualizado."

### Escena 4 — Los datos en Capella (2:45 – 3:30)
* **En pantalla:** Capella → Data Tools → Documents (colección `movimientos`, el movimiento recién creado con `stockAnterior` y `stockPosterior`). Luego Query, con:
  ```sql
  SELECT p.codigo, p.nombre, p.stockActual, p.stockMinimo
  FROM productos AS p
  WHERE p.estado = "ACTIVO" AND p.stockActual <= p.stockMinimo;
  ```
* **Voz:**
  > "Aquí está el movimiento que acabamos de registrar, con el stock anterior y el posterior para auditoría. Y con SQL++, un SQL para documentos JSON, consultamos los productos con stock bajo directamente en Capella."

### Escena 5 — CI/CD y cierre (3:30 – 4:30)
* **En pantalla:** GitHub Actions con el workflow en verde; luego `/api/health` mostrando Couchbase `CONNECTED`.
* **Voz:**
  > "Cada push a main ejecuta las pruebas del backend y compila el frontend en GitHub Actions. Solo si todo pasa, se despliega automáticamente en Render. Las credenciales de Capella nunca están en el código: son variables de entorno. Así queda SmartInventory: una base NoSQL en la nube, un inventario que no se descuadra y un despliegue sin pasos manuales. Los enlaces están en la descripción. ¡Gracias!"

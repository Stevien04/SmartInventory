# 🎬 Guion de Video y Storyboard: SmartInventory (< 5 Minutos)

**Duración:** 4:30 minutos (Máximo permitido: 5:00 min)  
**Plataforma:** YouTube / TikTok / Facebook / LinkedIn  
**Stack Demostrado:** MongoDB Atlas, Redis Cloud, Neo4j AuraDB, Prometheus, React y Node.js  

---

## ⏱️ Tabla de Tiempos y Estructura

| Segmento | Tiempo | Título del Bloque | Contenido Principal |
| :---: | :---: | :--- | :--- |
| **1** | 0:00 – 0:30 | Problema y Objetivo | Introducción de SmartInventory y presentación de la arquitectura NoSQL políglota. |
| **2** | 0:30 – 1:15 | Arquitectura Políglota | Explicación del rol de MongoDB, Redis, Neo4j y Prometheus. |
| **3** | 1:15 – 2:45 | Demostración en Vivo | Login JWT, catálogo, registro de movimiento sin stock negativo y respuesta ultrarrápida con Redis. |
| **4** | 2:45 – 3:45 | CI/CD y Automatización | Ejecución de pruebas en GitHub Actions y deploy automático en Render. |
| **5** | 3:45 – 4:30 | Observabilidad y Persistencia | Inspección de `/metrics` en Prometheus, datos en MongoDB Atlas y grafo en Neo4j. |

---

## 📝 Guion Escena por Escena

### Escena 1: Introducción y Planteamiento (0:00 – 0:30)
* **En pantalla:** Logo de SmartInventory con los 4 iconos: MongoDB, Redis, Neo4j y Prometheus.
* **Voz en off:**
  > "¡Hola a todos! Bienvenidos a la presentación de **SmartInventory**, un sistema inteligente de control de inventario full-stack diseñado bajo una arquitectura de **persistencia políglota y observabilidad de nivel empresarial**.
  > En este proyecto combinamos la flexibilidad de **MongoDB**, la velocidad en memoria de **Redis**, el análisis de relaciones en **Neo4j** y la monitorización de métricas en tiempo real con **Prometheus**. A continuación, les mostraremos su funcionamiento y despliegue automatizado en la nube."

---

### Escena 2: Arquitectura del Sistema (0:30 – 1:15)
* **En pantalla:** Diagrama interactivo conectando React, Express, MongoDB Atlas, Redis Cloud, Neo4j AuraDB y Prometheus.
* **Voz en off:**
  > "Nuestra arquitectura desacoplada utiliza una Single Page Application en React y Vite en el frontend, y una API REST en Node.js y Express en el backend.
  > Cada tecnología NoSQL cumple un propósito específico: MongoDB maneja los documentos del catálogo y las transacciones de inventario; Redis acelera las consultas del dashboard sirviendo datos en submilisegundos; Neo4j modela el grafo de proveedores y productos; y Prometheus supervisa continuamente la salud de la aplicación mediante métricas de latencia y existencias."

---

### Escena 3: Demostración en Vivo en Producción (1:15 – 2:45)
* **En pantalla:** Navegador en `https://smartinventory-app.onrender.com`.
  - Login con JWT.
  - Dashboard cargando métricas con el indicador `_source: Redis In-Memory Cache`.
  - Intento de salida con cantidad mayor a existencias: se dispara el error *"Stock insuficiente. No se permite stock negativo"*.
  - Salida válida: se procesa atómicamente, se invalida la caché de Redis y el dashboard se actualiza al instante con el nuevo estado de alerta.
* **Voz en off:**
  > "Aquí vemos la aplicación en vivo desde su URL pública en Render. Iniciamos sesión y vemos cómo el dashboard responde casi instantáneamente gracias a la caché de Redis.
  > Si un operador intenta despachar más unidades de las disponibles, la transacción en MongoDB aborta inmediatamente, impidiendo cualquier inconsistencia de existencias. 
  > Al registrar una salida válida, el movimiento se guarda, la caché de Redis se purga de forma reactiva y el sistema evalúa los umbrales de alerta en tiempo real."

---

### Escena 4: CI/CD y Despliegue Automatizado (2:45 – 3:45)
* **En pantalla:** Pestaña de GitHub Actions mostrando el workflow `deploy.yml`. Ejecución de tests del backend, build de Vite y llamada segura a los Deploy Webhooks de Render.
* **Voz en off:**
  > "El proceso de despliegue es 100% automatizado. Con GitHub Actions, cada `push` valida las pruebas unitarias que verifican los algoritmos de cálculo de stock.
  > Únicamente cuando los tests son aprobados con éxito, el pipeline invoca los Webhooks de Render, actualizando la infraestructura sin tiempo de inactividad ni intervención humana."

---

### Escena 5: Métricas en Prometheus, Grafo Neo4j y Cierre (3:45 – 4:30)
* **En pantalla:**
  - Pestaña con `/metrics`: mostrar `smartinventory_movimientos_total` incrementado.
  - Interfaz de MongoDB Atlas con los documentos de la colección `movimientos`.
  - Pestaña de Neo4j Browser mostrando los nodos `(:Proveedor)-[:SUMINISTRA]->(:Producto)`.
* **Voz en off:**
  > "Para finalizar, observamos el endpoint `/metrics` de Prometheus, donde vemos registradas las métricas de peticiones y transacciones exitosas. Además, comprobamos la persistencia en MongoDB y la red de suministros en Neo4j.
  > Con esto demostramos la potencia de combinar múltiples motores NoSQL para crear soluciones robustas, escalables y observables. Todos los enlaces y el código fuente están disponibles en la descripción. ¡Muchas gracias!"

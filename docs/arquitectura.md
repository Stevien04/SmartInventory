# Arquitectura del Sistema — SmartInventory

## 1. Visión General
SmartInventory es una solución cloud-native diseñada bajo el patrón de arquitectura desacoplada en tres capas (Three-Tier Architecture), operando con una base de datos puramente **NoSQL en documentos** mediante **Couchbase Capella**.

```text
  [ Cliente Web (Navegador) ]
               │
               ▼ HTTPS (Vite SPA)
  [ Frontend: React 18 + Tailwind CSS ]  (Render Static Site)
               │
               ▼ HTTPS / REST (JWT Bearer)
  [ Backend: Node.js + Express API ]     (Render Web Service)
               │
               ▼ TLS couchbases:// (SDK v4)
  [ Couchbase Capella DBaaS ]            (Nube Pública Couchbase)
       ├── Bucket: smartinventory
       └── Scope: gestion
            ├── usuarios
            ├── productos
            ├── categorias
            ├── proveedores
            ├── movimientos
            └── alertas
```

## 2. Restricciones de Cumplimiento
- **Prohibido:** Redis, MongoDB, Neo4j, Prometheus.
- **Implementado:** Couchbase Capella (Document store + SQL++/N1QL + ACID multi-document transactions).
- **Seguridad:** Ninguna credencial de base de datos se expone al cliente frontend. Todas residen en variables de entorno encriptadas en Render.

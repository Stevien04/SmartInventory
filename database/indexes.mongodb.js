// SmartInventory — Índices de MongoDB
// Mongoose ya los crea al arrancar a partir de los esquemas de backend/src/models/.
// Este script sirve para crearlos a mano desde mongosh:
//   mongosh "<MONGODB_URI>" database/indexes.mongodb.js

db.usuarios.createIndex({ id: 1 }, { unique: true });
db.usuarios.createIndex({ email: 1 }, { unique: true });

db.productos.createIndex({ id: 1 }, { unique: true });
db.productos.createIndex({ codigo: 1 }, { unique: true });

db.categorias.createIndex({ id: 1 }, { unique: true });
db.proveedores.createIndex({ id: 1 }, { unique: true });

db.movimientos.createIndex({ id: 1 }, { unique: true });
db.movimientos.createIndex({ operacionId: 1 });
db.movimientos.createIndex({ productoId: 1 });

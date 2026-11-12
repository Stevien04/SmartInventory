// SmartInventory — Consultas de ejemplo para el grafo de suministro
// Ejecutar en Neo4j Browser (local: http://localhost:7474) o en la consola de AuraDB.

// 1. Ver el grafo completo
MATCH (prov:Proveedor)-[s:SUMINISTRA]->(p:Producto)-[c:PERTENECE_A]->(cat:Categoria)
RETURN prov, s, p, c, cat;

// 2. Productos que dependen de un proveedor (impacto si ese proveedor falla)
MATCH (prov:Proveedor {nombre: 'TechSupply Global S.A.'})-[:SUMINISTRA]->(p:Producto)
RETURN p.id AS id, p.nombre AS producto
ORDER BY producto;

// 3. Cantidad de proveedores por categoría (categorías con un solo proveedor = riesgo)
MATCH (prov:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(cat:Categoria)
RETURN cat.nombre AS categoria, count(DISTINCT prov) AS proveedores
ORDER BY proveedores ASC;

// 4. Proveedores que comparten categoría (alternativas de abastecimiento)
MATCH (a:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(cat:Categoria)<-[:PERTENECE_A]-(:Producto)<-[:SUMINISTRA]-(b:Proveedor)
WHERE a.nombre < b.nombre
RETURN cat.nombre AS categoria, a.nombre AS proveedorA, b.nombre AS proveedorB;

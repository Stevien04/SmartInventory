import { Router } from 'express';
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  desactivarProducto
} from '../controllers/productoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', roleMiddleware(['ADMINISTRADOR']), crearProducto);
router.put('/:id', roleMiddleware(['ADMINISTRADOR']), actualizarProducto);
router.delete('/:id', roleMiddleware(['ADMINISTRADOR']), desactivarProducto);

export default router;

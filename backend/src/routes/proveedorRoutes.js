import { Router } from 'express';
import { listarProveedores, crearProveedor } from '../controllers/proveedorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listarProveedores);
router.post('/', roleMiddleware(['ADMINISTRADOR']), crearProveedor);

export default router;

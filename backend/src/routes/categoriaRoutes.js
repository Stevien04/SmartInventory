import { Router } from 'express';
import { listarCategorias, crearCategoria } from '../controllers/categoriaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listarCategorias);
router.post('/', roleMiddleware(['ADMINISTRADOR']), crearCategoria);

export default router;

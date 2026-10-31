import { Router } from 'express';
import { listarMovimientos, registrarMovimiento } from '../controllers/movimientoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listarMovimientos);
router.post('/', registrarMovimiento);

export default router;

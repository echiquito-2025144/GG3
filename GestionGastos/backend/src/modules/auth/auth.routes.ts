import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register); 
router.patch('/perfil/foto', AuthController.actualizarFoto); 

export default router;
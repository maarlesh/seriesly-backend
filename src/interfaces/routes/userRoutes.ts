import { Router } from 'express';
import { register } from '../controller/userController';
import { login } from '../controller/userController';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;

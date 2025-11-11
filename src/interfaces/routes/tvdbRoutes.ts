import { Router } from 'express';
import { login } from '../controller/tvdbController';

const router = Router();

router.post('/login', login);

export default router;

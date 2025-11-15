import { Router } from 'express';
import { searchOrAddMovie, searchOrAddSeries } from '../controller/movieController';

const router = Router();

router.get('/', searchOrAddMovie);
router.get('/series', searchOrAddSeries);


export default router;

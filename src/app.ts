import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tvdbRoutes from './interfaces/routes/tvdbRoutes';
import userRoutes from './interfaces/routes/userRoutes';
import searchRoutes from './interfaces/routes/searchRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/tvdb', tvdbRoutes);
app.use('/user', userRoutes);
app.use('/search', searchRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Seriesly Backend Running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

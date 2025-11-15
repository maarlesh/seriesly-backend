import { Request, Response } from 'express';
import { getOrCreateMovies, getOrCreateSeries, } from '../../core/usecases/movieService';

export async function searchOrAddMovie(req: Request, res: Response) {
  try {
    const title = req.query.title as string;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title query parameter is required.' });
    }

    const tvdbApiKey = process.env.TVDB_API_KEY!;
    if (!tvdbApiKey) {
      return res.status(500).json({ error: 'TVDB API key is not configured.' });
    }

    const movie = await getOrCreateMovies(title.trim(), tvdbApiKey);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found locally or on TVDB.' });
    }

    return res.json(movie);
  } catch (error) {
    console.error('Error in searchOrAddMovie:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}


export async function searchOrAddSeries(req: Request, res: Response) {
  try {
    const title = req.query.title as string;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title query parameter is required.' });
    }

    const tvdbApiKey = process.env.TVDB_API_KEY!;
    if (!tvdbApiKey) {
      return res.status(500).json({ error: 'TVDB API key is not configured.' });
    }

    const series = await getOrCreateSeries(title.trim(), tvdbApiKey);

    if (!series || series.length === 0) {
      return res.status(404).json({ error: 'Series not found locally or on TVDB.' });
    }

    return res.json(series);
  } catch (error) {
    console.error('Error in searchOrAddSeries:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}

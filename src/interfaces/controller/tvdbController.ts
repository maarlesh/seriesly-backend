import { Request, Response } from 'express';
import { loginToTvdb } from '../../infrastructure/external/tvdbService';

export async function login(req: Request, res: Response) {
  try {
    const apiKey = process.env.TVDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'TVDB API key not configured' });
    }
    const token = await loginToTvdb(apiKey);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

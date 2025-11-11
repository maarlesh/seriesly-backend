import { Request, Response } from 'express';
import { createUser, authenticateUser } from '../../core/usecases/userService';

export async function register(req: Request, res: Response) {
  try {
    const { user_name, password } = req.body;
    if (!user_name || !password) {
      return res.status(400).json({ error: 'Missing user_name or password' });
    }
    const user = await createUser(user_name, password);
    if (!user) {
      return res.status(500).json({ error: 'User creation failed' });
    }
    res.status(201).json({ user_id: user.id, user_name: user.user_name });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { user_name, password } = req.body;
    if (!user_name || !password) {
      return res.status(400).json({ error: 'Missing user_name or password' });
    }
    const user = await authenticateUser(user_name, password);
    res.json({ user_id: user.id, user_name: user.user_name });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

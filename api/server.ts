import app from '../server';
import type { Request, Response } from 'express';

// Vercel serverless function handler
export default function handler(req: Request, res: Response) {
  app(req, res);
}


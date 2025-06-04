import { VercelRequest, VercelResponse } from '@vercel/node';
import { computeCode } from '../apis/code';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const grid = (req.body as any)?.grid;
  if (!Array.isArray(grid)) {
    res.status(400).json({ error: 'Grid is required in request body and must be an array.' });
    return;
  }
  const code = computeCode(grid, new Date());
  res.status(200).json({ code });
}

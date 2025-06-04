import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateGrid, setBiasChar } from '../apis/grid';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const bias = typeof req.query.bias === 'string' ? req.query.bias : null;
  if (bias !== null) {
    setBiasChar(bias);
  }
  const grid = generateGrid();
  res.status(200).json({ grid });
}

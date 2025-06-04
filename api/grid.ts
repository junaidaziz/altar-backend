import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateGrid, setBiasChar } from '../apis/grid';
import { computeCode } from '../apis/code';
import { pushGridUpdate } from '../apis/firebase';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const bias = typeof req.query.bias === 'string' ? req.query.bias : null;
  if (bias !== null) {
    setBiasChar(bias);
  }
  const grid = generateGrid();
  const code = computeCode(grid, new Date());
  pushGridUpdate(grid, code).catch(err => console.error('Firebase update failed', err));
  res.status(200).json({ grid });
}

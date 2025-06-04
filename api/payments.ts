import { VercelRequest, VercelResponse } from '@vercel/node';
import { Payment } from '../apis/payments';
import { pushPayment } from '../apis/firebase';

const payments: Payment[] = [];

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.status(200).json(payments);
    return;
  }

  if (req.method === 'POST') {
    const { name, amount, code, grid } = req.body || {};
    if (!name || typeof amount !== 'number' || !code || !Array.isArray(grid)) {
      res.status(400).json({ error: 'Name, amount, code, and grid are required.' });
      return;
    }
    const newPayment: Payment = {
      id: Date.now().toString(),
      name,
      amount,
      code,
      grid,
      timestamp: new Date(),
    };
    payments.push(newPayment);
    pushPayment(newPayment).catch(err => console.error('Firebase payment failed', err));
    res.status(201).json(newPayment);
    return;
  }

  res.status(405).send('Method not allowed');
}

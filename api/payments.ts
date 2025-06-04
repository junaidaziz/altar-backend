import { VercelRequest, VercelResponse } from '@vercel/node';
import { Payment } from '../apis/payments';
import { pushPayment, fetchPayments } from '../apis/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const items = await fetchPayments();
      res.status(200).json(items);
    } catch (err) {
      console.error('Failed to fetch payments', err);
      res.status(500).json({ error: 'Failed to load payments' });
    }
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
    try {
      await pushPayment(newPayment);
      res.status(201).json(newPayment);
    } catch (err) {
      console.error('Failed to store payment', err);
      res.status(500).json({ error: 'Failed to store payment' });
    }
    return;
  }

  res.status(405).send('Method not allowed');
}

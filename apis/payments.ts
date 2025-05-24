import { Router, Request, Response } from "express";

const paymentsRouter = Router();

interface Payment {
  id: string;
  name: string;
  amount: number;
  code: string;
  grid: string[][];
  timestamp: Date;
}

// In-memory payment store
const payments: Payment[] = [];

paymentsRouter.get("/", (req: Request, res: Response) => {
  res.json(payments);
});

paymentsRouter.post("/", (req: Request, res: Response) => {
  const { name, amount, code, grid } = req.body;

  if (!name || typeof amount !== "number" || !code || !Array.isArray(grid)) {
    return res
      .status(400)
      .json({ error: "Name, amount, code, and grid are required." });
  }

  const newPayment: Payment = {
    id: Date.now().toString(),
    name,
    amount,
    code,
    grid,
    timestamp: new Date()
  };

  payments.push(newPayment);
  res.status(201).json(newPayment);
});

export default paymentsRouter;

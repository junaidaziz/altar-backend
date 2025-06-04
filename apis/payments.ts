import { Router, Request, Response } from "express";
import { fetchPayments, pushPayment } from "./firebase";

// Define an interface for a Payment object
export interface Payment {
  id: string;
  name: string;
  amount: number;
  code: string;
  grid: string[][];
  timestamp: Date;
}

// This function will now return a configured router, accepting only the broadcast function
export default (broadcastPayment: (payment: Payment) => void) => {
  const paymentsRouter = Router();

  // GET route to retrieve all payments
  paymentsRouter.get("/", async (_req: Request, res: Response) => {
    try {
      const items = await fetchPayments();
      res.json(items);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      res.status(500).json({ error: "Failed to load payments" });
    }
  });

  // POST route to add a new payment
  paymentsRouter.post("/", async (req: Request, res: Response) => {
    // Destructure required fields from the request body
    const { name, amount, code, grid } = req.body;

    // Basic validation for required fields
    if (!name || typeof amount !== "number" || !code || !Array.isArray(grid)) {
      return res
        .status(400)
        .json({ error: "Name, amount, code, and grid are required." });
    }

    // Create a new payment object with a unique ID and timestamp
    const newPayment: Payment = {
      id: Date.now().toString(), // Simple unique ID generation (for demo purposes)
      name,
      amount,
      code,
      grid,
      timestamp: new Date()
    };

    try {
      await pushPayment(newPayment);
      try {
        broadcastPayment(newPayment);
      } catch (broadcastErr) {
        console.error("Failed to broadcast payment", broadcastErr);
      }
      res.status(201).json(newPayment);
    } catch (err) {
      console.error("Failed to store payment", err);
      res.status(500).json({
        error: "Failed to store payment",
        details: err instanceof Error ? err.message : String(err)
      });
    }
  });

  return paymentsRouter; // Export the router for use in index.ts
};

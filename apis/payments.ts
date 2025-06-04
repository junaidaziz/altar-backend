import { Router, Request, Response } from "express";

// Define an interface for a Payment object
export interface Payment {
  id: string;
  name: string;
  amount: number;
  code: string;
  grid: string[][];
  timestamp: Date;
}

// In-memory storage for payments. Data will be lost when the server restarts.
const payments: Payment[] = [];

// This function will now return a configured router, accepting only the broadcast function
export default (broadcastPayment: (payment: Payment) => void) => {
  const paymentsRouter = Router();

  // GET route to retrieve all payments
  paymentsRouter.get("/", (req: Request, res: Response) => {
    // Send the array of payments as a JSON response
    res.json(payments);
  });

  // POST route to add a new payment
  paymentsRouter.post("/", (req: Request, res: Response) => {
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

    payments.push(newPayment); // Add the new payment to the in-memory array

    // Send a success response with the newly created payment
    res.status(201).json(newPayment);

    // Broadcast the new payment to all connected WebSocket clients
    broadcastPayment(newPayment);
  });

  return paymentsRouter; // Export the router for use in index.ts
};

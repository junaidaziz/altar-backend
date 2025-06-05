import { Router, Request, Response } from "express";
import { fetchPayments, pushPayment } from "./firebase";

export interface Payment {
  id: string;
  name: string;
  amount: number;
  code: string;
  grid: { cells: string[] }[];
  gridSnippet?: string;
  timestamp: Date;
}

export default (broadcastAll: () => void) => {
  const paymentsRouter = Router();

  paymentsRouter.get("/", async (_req: Request, res: Response) => {
    try {
      const items = await fetchPayments();
      res.json(items);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      res.status(500).json({ error: "Failed to load payments" });
    }
  });

  paymentsRouter.post("/", async (req: Request, res: Response) => {
    const { name, amount, code, grid, gridSnippet } = req.body;

    if (
      !name ||
      typeof name !== "string" ||
      typeof amount !== "number" ||
      !code ||
      typeof code !== "string" ||
      !Array.isArray(grid)
    ) {
      return res
        .status(400)
        .json({ error: "Name, amount, code, and grid are required." });
    }

    const isValidGrid = grid.every(
      (row: any) =>
        typeof row === "object" &&
        Array.isArray((row as any).cells) &&
        (row as any).cells.every((c: any) => typeof c === "string")
    );
    if (!isValidGrid) {
      return res
        .status(400)
        .json({ error: "Grid must be an array of { cells: string[] }." });
    }

    if (gridSnippet !== undefined && typeof gridSnippet !== "string") {
      return res
        .status(400)
        .json({ error: "gridSnippet, if provided, must be a string." });
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      name,
      amount,
      code,
      grid: grid as { cells: string[] }[],
      gridSnippet: gridSnippet as string | undefined,
      timestamp: new Date()
    };

    try {
      await pushPayment(newPayment);
      try {
        broadcastAll();
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

  return paymentsRouter;
};

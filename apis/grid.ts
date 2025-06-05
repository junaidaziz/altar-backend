import express, { Request, Response } from "express";
import { computeCode } from "./code";
import { pushGridUpdate } from "./firebase";

const gridRouter = express.Router();

let persistedBiasChar: string | null = null;

export function setBiasChar(biasChar: string | null) {
  persistedBiasChar = biasChar;
}

export function getBiasChar(): string | null {
  return persistedBiasChar;
}

/**
 * Generates a 10x10 grid of random lowercase alphabet characters.
 * Optionally replaces 20% of the cells with a bias character.
 */
export function generateGrid(
  biasChar: string | null = persistedBiasChar
): string[][] {
  const grid: string[][] = [];
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const totalCells = 100;
  const biasCount = biasChar ? Math.floor(totalCells * 0.2) : 0;
  const biasPositions = new Set<number>();

  while (biasChar && biasPositions.size < biasCount) {
    biasPositions.add(Math.floor(Math.random() * totalCells));
  }

  for (let i = 0; i < 10; i++) {
    const row: string[] = [];
    for (let j = 0; j < 10; j++) {
      const index = i * 10 + j;
      row.push(
        biasChar && biasPositions.has(index)
          ? biasChar
          : alphabet[Math.floor(Math.random() * alphabet.length)]
      );
    }
    grid.push(row);
  }

  return grid;
}

gridRouter.get("/", async (req: Request, res: Response) => {
  // 1) If a bias query parameter is provided, update persistedBiasChar
  const bias = typeof req.query.bias === "string" ? req.query.bias : null;
  if (bias !== null) {
    setBiasChar(bias);
  }

  // 2) Always generate a brand-new grid & compute its code
  const newGrid = generateGrid();
  const newCode = computeCode(newGrid, new Date());

  // 3) Push the new grid+code into Firebase so SSE clients see it on next broadcast
  pushGridUpdate(newGrid, newCode).catch(err =>
    console.error("Firebase update failed", err)
  );

  // 4) Return the fresh grid and code immediately
  res.json({ grid: newGrid, code: newCode });
});

export default gridRouter;

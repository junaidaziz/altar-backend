import express, { Request, Response } from "express";

const gridRouter = express.Router();

/**
 * Generates a 10x10 grid of random lowercase alphabet characters.
 * Optionally replaces 20% of the cells with a bias character.
 */
export function generateGrid(biasChar: string | null = null): string[][] {
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

gridRouter.get("/", (req: Request, res: Response) => {
  const bias = typeof req.query.bias === "string" ? req.query.bias : null;
  const grid = generateGrid(bias);
  res.json({ grid });
});

export default gridRouter;

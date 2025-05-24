import express, { Request, Response } from "express";

const codeRouter = express.Router();

/**
 * Computes a two-digit code by counting specific characters in the grid.
 */
export function computeCode(grid: string[][]): string {
  const char1 = grid[3][6];
  const char2 = grid[6][3];

  const countChar = (char: string) =>
    grid.flat().filter(c => c === char).length;

  let count1 = countChar(char1);
  let count2 = countChar(char2);

  while (count1 > 9) count1 = Math.floor(count1 / 2);
  while (count2 > 9) count2 = Math.floor(count2 / 2);

  return `${count1}${count2}`;
}

codeRouter.post("/", (req: Request, res: Response) => {
  const grid = req.body.grid;

  if (!Array.isArray(grid)) {
    res.status(400).json({
      error: "Grid is required in request body and must be an array."
    });
    return;
  }

  const code = computeCode(grid);
  res.json({ code });
});

export default codeRouter;

// backend/apis/code.ts

import express, { Request, Response } from "express";

const codeRouter = express.Router();

export function computeCode(grid: string[][], currentTime: Date): string {
  const seconds = currentTime.getSeconds();
  const tens = Math.floor(seconds / 10);
  const units = seconds % 10;

  const char1 = grid[tens][units];
  const char2 = grid[units][tens];

  const countChar = (char: string) =>
    grid.flat().filter(c => c === char).length;

  let count1 = countChar(char1);
  let count2 = countChar(char2);

  // Reduce counts to single digits (0-9) by repeatedly dividing by 2 if > 9
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

  // When called via POST, the system clock is taken at the time of the request.
  const code = computeCode(grid, new Date());
  res.json({ code });
});

export default codeRouter;

import { generateGrid, setBiasChar } from '../apis/grid';

function countChar(grid: string[][], char: string): number {
  return grid.flat().filter(c => c === char).length;
}

describe('generateGrid bias persistence', () => {
  test('uses last set bias when no bias provided', () => {
    setBiasChar('z');
    const first = generateGrid();
    const second = generateGrid();

    expect(countChar(first, 'z')).toBeGreaterThan(0);
    expect(countChar(second, 'z')).toBeGreaterThan(0);
  });
});

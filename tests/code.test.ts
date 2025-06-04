import { computeCode } from '../apis/code';

describe('computeCode', () => {
  test('uses timestamp seconds to select grid positions only', () => {
    // prepare grid filled with 'a'
    const grid = Array.from({ length: 10 }, () => Array(10).fill('a'));

    grid[3][6] = 'b';
    grid[6][3] = 'c';

    // add additional b's to make total 12
    let added = 0;
    for (let i = 0; i < 10 && added < 11; i++) {
      for (let j = 0; j < 10 && added < 11; j++) {
        if (grid[i][j] === 'a') {
          grid[i][j] = 'b';
          added++;
        }
      }
    }

    // add additional c's to make total 5
    added = 0;
    for (let i = 9; i >= 0 && added < 4; i--) {
      for (let j = 9; j >= 0 && added < 4; j--) {
        if (grid[i][j] === 'a') {
          grid[i][j] = 'c';
          added++;
        }
      }
    }

    const time = new Date('2020-01-01T00:00:36Z');
    expect(computeCode(grid, time)).toBe('65');
  });
});

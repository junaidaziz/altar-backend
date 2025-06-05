import express from 'express';
import request from 'supertest';

import codeRouter from '../apis/code';
import gridRouter from '../apis/grid';
import paymentsRouter from '../apis/payments';

jest.mock('../apis/firebase', () => ({
  pushGridUpdate: jest.fn().mockResolvedValue(undefined),
  pushPayment: jest.fn().mockResolvedValue(undefined),
  fetchPayments: jest.fn().mockResolvedValue([]),
}));

const { pushPayment, fetchPayments } = require('../apis/firebase');

describe('API routers', () => {
  describe('codeRouter', () => {
    const app = express();
    app.use(express.json());
    app.use('/', codeRouter);

    test('returns 400 if body missing grid', async () => {
      const res = await request(app).post('/').send({});
      expect(res.status).toBe(400);
    });

    test('returns computed code for valid grid', async () => {
      const grid = Array.from({ length: 10 }, () => Array(10).fill('a'));
      const res = await request(app).post('/').send({ grid });
      expect(res.status).toBe(200);
      expect(typeof res.body.code).toBe('string');
      expect(res.body.code).toHaveLength(2);
    });
  });

  describe('gridRouter', () => {
    const app = express();
    app.use(express.json());
    app.use('/', gridRouter);

    test('returns grid and code', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.grid)).toBe(true);
      expect(res.body.grid).toHaveLength(10);
      expect(res.body.grid[0]).toHaveLength(10);
      expect(typeof res.body.code).toBe('string');
    });
  });

  describe('paymentsRouter', () => {
    const broadcast = jest.fn();
    const app = express();
    app.use(express.json());
    app.use('/', paymentsRouter(broadcast));

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('GET returns payments', async () => {
      (fetchPayments as jest.Mock).mockResolvedValueOnce([{ id: '1' }]);
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: '1' }]);
    });

    test('POST validates body', async () => {
      const res = await request(app).post('/').send({ name: 'a' });
      expect(res.status).toBe(400);
    });

    test('POST stores payment', async () => {
      const body = { name: 'John', amount: 5, code: '11', grid: [{ cells: ['a'] }], gridSnippet: 'a' };
      const res = await request(app).post('/').send(body);
      expect(res.status).toBe(201);
      expect(pushPayment).toHaveBeenCalled();
      expect(broadcast).toHaveBeenCalled();
      expect(res.body).toMatchObject({ name: 'John', amount: 5, code: '11' });
      expect(res.body.grid).toEqual([{ cells: ['a'] }]);
    });
  });
});

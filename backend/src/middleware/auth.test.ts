import jwt from 'jsonwebtoken';
import { authenticate } from './auth';

describe('authenticate middleware', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('accepts a Bearer token from the Authorization header', () => {
    const token = jwt.sign({ sub: '42', email: 'vendor@example.com', role: 'Admin' }, 'test-secret');
    const req: any = { headers: { authorization: `Bearer ${token}` }, query: {} };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 42, email: 'vendor@example.com', role: 'Admin' });
  });

  it('accepts a token from the query string for SSE/EventSource', () => {
    const token = jwt.sign({ sub: '7', email: 'sse@example.com', role: 'Member' }, 'test-secret');
    const req: any = { headers: {}, query: { token } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 7, email: 'sse@example.com', role: 'Member' });
  });

  it('rejects missing tokens with 401', () => {
    const req: any = { headers: {}, query: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token tidak ditemukan. Silakan login.' });
    expect(next).not.toHaveBeenCalled();
  });
});

// tests/adapters.express.test.ts
import { protect } from '../src/adapters/express';
import { Accord } from '../src/accord';
import { Decision } from '../src/core/types';

// Mock Express types (simplified for test)
const mockReq = (userId: string, resourceId: string, body: any = {}) => ({
  headers: { 'x-user-id': userId },
  params: { id: resourceId },
  body: body
} as any);

const mockRes = () => {
  const res: any = {
    status: (code: number) => {
      res.statusCode = code;
      return res;
    },
    json: (data: any) => {
      res.body = data;
      return res;
    }
  };
  return res;
};

describe('Express Adapter', () => {
  let accord: Accord;

  beforeAll(() => {
    accord = new Accord({
      policyPath: './config/policies.json',
      identityPath: './config/identities.json'
    });
  });

  test('1. Should call next() for authorized user (u1 Admin)', async () => {
    const req = mockReq('u1', 'b1');
    const res = mockRes();
    const next = jest.fn();

    const middleware = protect({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    await middleware(req, res, next);

    // Expect next() to be called (Allowed)
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeUndefined(); // No error sent
  });

  test('2. Should return 403 for unauthorized user (u2 Guest)', async () => {
    const req = mockReq('u2', 'b1'); // u2 is guest
    const res = mockRes();
    const next = jest.fn();

    const middleware = protect({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    await middleware(req, res, next);

    // Expect 403 Forbidden
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Access Denied');
    expect(next).not.toHaveBeenCalled();
  });

  test('3. Should return 403 for suspended user', async () => {
    // 1. Suspend u1
    accord.getStore().updateIdentity('u1', { status: 'suspended' });

    const req = mockReq('u1', 'b1');
    const res = mockRes();
    const next = jest.fn();

    const middleware = protect({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    await middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Access Denied');
    expect(res.body.reason).toContain('suspended');

    // Cleanup
    accord.getStore().updateIdentity('u1', { status: 'active' });
  });
});
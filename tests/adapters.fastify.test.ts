// tests/adapters.fastify.test.ts
import { accordHook } from '../src/adapters/fastify';
import { Accord } from '../src/accord';

// Mock Fastify objects
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
    send: (data: any) => {
      res.body = data;
      return res;
    }
  };
  return res;
};

describe('Fastify Adapter', () => {
  let accord: Accord;

  beforeAll(async () => { 
    accord = await Accord.create({
      policyPath: './config/policies.json',
      identityPath: './config/identities.json'
    } as any);
  });

  test('1. Should allow request for u1 Admin', async () => {
    const hook = accordHook({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    const req = mockReq('u1', 'b1');
    const res = mockRes();

    await hook(req, res);

    // If allowed, status is undefined (not 403)
    expect(res.statusCode).toBeUndefined();
    expect(res.body).toBeUndefined();
  });

  test('2. Should block request for u2 Guest', async () => {
    const hook = accordHook({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    const req = mockReq('u2', 'b1');
    const res = mockRes();

    await hook(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Access Denied');
  });
});
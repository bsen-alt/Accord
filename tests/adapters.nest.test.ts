// tests/adapters.nest.test.ts
import { AccordGuard } from '../src/adapters/nest';
import { Accord } from '../src/accord';
import { ExecutionContext } from '@nestjs/common';

// Mock ExecutionContext
const createMockContext = (userId: string, resourceId: string, body: any = {}) => {
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { 'x-user-id': userId },
        params: { id: resourceId },
        body: body
      }),
      getResponse: () => ({})
    })
  } as any;
  return context;
};

describe('NestJS Adapter', () => {
  let accord: Accord;

  beforeAll(async () => { 
    accord = await Accord.create({
      policyPath: './config/policies.json',
      identityPath: './config/identities.json'
    } as any);
  });

  test('1. Should return true for authorized user (u1 Admin)', async () => {
    const guard = new AccordGuard({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    const context = createMockContext('u1', 'b1');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  test('2. Should return false for unauthorized user (u2 Guest)', async () => {
    const guard = new AccordGuard({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking'
    });

    const context = createMockContext('u2', 'b1');
    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });
});
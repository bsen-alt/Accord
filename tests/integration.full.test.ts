// tests/integration.full.test.ts
import { Accord, AccordConfig } from '../src/accord';

describe('Accord Full Pipeline Integration', () => {
  let accord: Accord;

  beforeAll(() => {
    const config: AccordConfig = {
      policyPath: './config/policies.json',
      identityPath: './config/identities.json'
    };
    accord = new Accord(config);
  });

  test('1. Should ALLOW via high-level API (u1 is admin)', async () => {
    const decision = await accord.check(
      'u1', 
      'delete', 
      { type: 'booking', id: 'b1', attributes: {} }
    );

    expect(decision.decision).toBe('allow');
    expect(decision.policy_id).toBe('policy-admin-allow');
  });

  test('2. Should DENY suspended user via high-level API', async () => {
    // 1. Suspend user u1
    accord.getStore().updateIdentity('u1', { status: 'suspended' });

    // 2. Check access
    const decision = await accord.check(
      'u1', 
      'delete', 
      { type: 'booking', id: 'b1', attributes: {} }
    );

    expect(decision.decision).toBe('deny');
    expect(decision.reason).toContain('suspended');

    // Cleanup
    accord.getStore().updateIdentity('u1', { status: 'active' });
  });

  test('3. Should handle user not found gracefully', async () => {
    const decision = await accord.check(
      'unknown_user', 
      'delete', 
      { type: 'booking', id: 'b1', attributes: {} }
    );

    expect(decision.decision).toBe('deny');
    expect(decision.reason).toContain('not found');
  });
});
// tests/evaluator.test.ts
import { evaluate } from '../src/core/evaluator';
import { Policy, AccessRequest, Decision, Identity } from '../src/core/types';

describe('Accord Evaluation Engine', () => {
  
  // Mock Data Setup (Same as before)
  const adminPolicy: Policy = {
    id: 'policy-admin',
    version: '1.0',
    effect: 'allow',
    subject: { type: 'user', attributes: { role: 'admin' } },
    action: ['delete', 'update'],
    resource: { type: 'booking' },
  };

  const specificDenyPolicy: Policy = {
    id: 'policy-deny-suspension',
    version: '1.0',
    effect: 'deny',
    subject: { type: 'user', attributes: { status: 'suspended' } },
    action: ['delete'],
    resource: { type: 'booking' },
  };

  const userRequest: AccessRequest = {
    subject: { id: 'u1', type: 'user', status: 'active', attributes: { role: 'admin' } },
    action: 'delete',
    resource: { type: 'booking', id: 'b1', attributes: {} },
  };

  // Added 'async' keyword to test functions
  test('1. Should ALLOW when matching policy exists', async () => {
    const result = await evaluate(userRequest, [adminPolicy]); // <--- AWAIT
    expect(result.decision).toBe('allow');
    expect(result.policy_id).toBe('policy-admin');
  });

  test('2. Should DENY (Default Deny) when no policies match', async () => {
    const guestRequest: AccessRequest = {
      subject: { id: 'u2', type: 'user', status: 'active', attributes: { role: 'guest' } },
      action: 'delete',
      resource: { type: 'booking', id: 'b1', attributes: {} },
    };
    const result = await evaluate(guestRequest, [adminPolicy]); // <--- AWAIT
    expect(result.decision).toBe('deny');
    expect(result.reason).toContain('No matching policy');
  });

  test('3. Should DENY when Explicit Deny overrides Allow', async () => {
    const suspendedAdminRequest: AccessRequest = {
      subject: { 
        id: 'u1', 
        type: 'user', 
        status: 'suspended',
        attributes: { role: 'admin' } 
      },
      action: 'delete',
      resource: { type: 'booking', id: 'b1', attributes: {} },
    };

    const result = await evaluate(suspendedAdminRequest, [adminPolicy, specificDenyPolicy]); // <--- AWAIT
    
    expect(result.decision).toBe('deny');
    expect(result.policy_id).toBe('policy-deny-suspension');
  });

  test('4. Should DENY when Explicit Deny is listed first (Order Independence)', async () => {
    const suspendedAdminRequest: AccessRequest = {
      subject: { 
        id: 'u1', 
        type: 'user', 
        status: 'suspended', 
        attributes: { role: 'admin' } 
      },
      action: 'delete',
      resource: { type: 'booking', id: 'b1', attributes: {} },
    };

    const result = await evaluate(suspendedAdminRequest, [specificDenyPolicy, adminPolicy]); // <--- AWAIT
    
    expect(result.decision).toBe('deny');
  });

  test('5. Should ALLOW based on complex condition (Owner check)', async () => {
    const ownerPolicy: Policy = {
      id: 'policy-owner',
      version: '1.0',
      effect: 'allow',
      subject: { type: 'user' },
      action: ['update'],
      resource: { type: 'document' },
      condition: 'subject.id = resource.attributes.owner_id' 
    };

    const ownerRequest: AccessRequest = {
      subject: { id: 'user_123', type: 'user', status: 'active', attributes: {} },
      action: 'update',
      resource: { type: 'document', id: 'doc_1', attributes: { owner_id: 'user_123' } }
    };

    const resultAllow = await evaluate(ownerRequest, [ownerPolicy]); // <--- AWAIT
    expect(resultAllow.decision).toBe('allow');

    const strangerRequest: AccessRequest = {
      subject: { id: 'user_999', type: 'user', status: 'active', attributes: {} },
      action: 'update',
      resource: { type: 'document', id: 'doc_1', attributes: { owner_id: 'user_123' } }
    };

    const resultDeny = await evaluate(strangerRequest, [ownerPolicy]); // <--- AWAIT
    expect(resultDeny.decision).toBe('deny'); 
  });
});
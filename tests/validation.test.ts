// tests/validation.test.ts
import { Schemas } from '../src/core/validation';

describe('Zod Validation', () => {
  
  test('1. Should accept a valid Policy', () => {
    const validPolicy = {
      id: 'test-policy',
      version: '1.0',
      effect: 'allow',
      subject: { type: 'user', attributes: { role: 'admin' } },
      action: ['delete'],
      resource: { type: 'booking' }
    };

    const result = Schemas.Policy.safeParse(validPolicy);
    expect(result.success).toBe(true);
  });

  test('2. Should reject a Policy with invalid Effect', () => {
    const invalidPolicy = {
      id: 'test-policy',
      version: '1.0',
      effect: 'maybe', // Invalid
      subject: { type: 'user' },
      action: ['delete'],
      resource: { type: 'booking' }
    };

    const result = Schemas.Policy.safeParse(invalidPolicy);
    expect(result.success).toBe(false);
    if (!result.success) {
      // UPDATED STRING to match Zod's actual error
      expect(result.error.issues[0].message).toContain("expected one of");
    }
  });

  test('3. Should reject an Identity with invalid Status', () => {
    const invalidIdentity = {
      id: 'u1',
      type: 'user',
      status: 'banned', // Invalid
      attributes: {}
    };

    const result = Schemas.Identity.safeParse(invalidIdentity);
    expect(result.success).toBe(false);
  });
});
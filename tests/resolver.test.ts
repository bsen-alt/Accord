// tests/resolver.test.ts
import { IdentityResolver } from '../src/core/resolver';
import { IdentityStore } from '../src/store/identity';

describe('Identity Resolver', () => {
  let store: IdentityStore;
  let resolver: IdentityResolver;

  beforeAll(() => {
    store = new IdentityStore('./config/identities.json');
    // Force u1 to active before running tests (Cleanup from previous runs)
    try {
      store.updateIdentity('u1', { status: 'active' });
    } catch (e) {
      // Ignore if user doesn't exist yet
    }

    resolver = new IdentityResolver(store);
  });

  test('1. Should resolve a valid active user', () => {
    const user = resolver.resolve('u1');
    expect(user.id).toBe('u1');
    expect(user.status).toBe('active');
  });

  test('2. Should throw error for suspended user (Kill Switch)', () => {
    // 1. Ensure u1 is active
    store.updateIdentity('u1', { status: 'active' });

    // 2. Suspend them
    store.updateIdentity('u1', { status: 'suspended' });

    // 3. Try to resolve -> Should Error
    expect(() => {
      resolver.resolve('u1');
    }).toThrow('is suspended');

    // Cleanup
    store.updateIdentity('u1', { status: 'active' });
  });

  test('3. Should throw error for unknown user', () => {
    expect(() => {
      resolver.resolve('ghost_user');
    }).toThrow('Identity not found');
  });
});
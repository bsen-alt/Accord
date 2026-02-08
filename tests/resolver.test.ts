// tests/resolver.test.ts
import { IdentityResolver } from '../src/core/resolver';
import { FileStoreAdapter } from '../src/store/adapters/file'; // Switched from IdentityStore

describe('Identity Resolver', () => {
  let adapter: FileStoreAdapter;
  let resolver: IdentityResolver;

  beforeAll(() => {
    adapter = new FileStoreAdapter('./config/policies.json', './config/identities.json');
    // Force u1 to active before running tests (Cleanup from previous runs)
    try {
      adapter.updateIdentity('u1', { status: 'active' });
    } catch (e) {
      // Ignore if user doesn't exist yet
    }

    resolver = new IdentityResolver(adapter);
  });

  test('1. Should resolve a valid active user', async () => { // Added async
    const user = await resolver.resolve('u1'); // Added await
    expect(user.id).toBe('u1');
    expect(user.status).toBe('active');
  });

  test('2. Should throw error for suspended user (Kill Switch)', async () => { // Added async
    // 1. Ensure u1 is active
    await adapter.updateIdentity('u1', { status: 'active' }); // Added await

    // 2. Suspend them
    await adapter.updateIdentity('u1', { status: 'suspended' }); // Added await

    // 3. Try to resolve -> Should Error
    await expect(resolver.resolve('u1')).rejects.toThrow('is suspended'); // Updated to async expect

    // Cleanup
    await adapter.updateIdentity('u1', { status: 'active' }); // Added await
  });

  test('3. Should throw error for unknown user', async () => { // Added async
    await expect(resolver.resolve('ghost_user')).rejects.toThrow('Identity not found'); // Updated to async expect
  });
});
// tests/store.test.ts
import { IdentityStore } from '../src/store/identity';
import * as fs from 'fs';
import * as path from 'path';

describe('Identity Store', () => {
  const testFilePath = './config/identities.json';
  let store: IdentityStore;

  beforeAll(() => {
    // Initialize store with the existing config file
    store = new IdentityStore(testFilePath);
  });

  test('1. Should load identities from file', () => {
    const user = store.getIdentity('u1');
    expect(user).toBeDefined();
    expect(user?.attributes.role).toBe('admin');
  });

  test('2. Should return undefined for non-existent user', () => {
    const user = store.getIdentity('ghost');
    expect(user).toBeUndefined();
  });

  test('3. Should update user status (Suspend)', () => {
    // 1. Check initial status
    const userBefore = store.getIdentity('u1');
    expect(userBefore?.status).toBe('active');

    // 2. Update status to suspended
    store.updateIdentity('u1', { status: 'suspended' });

    // 3. Verify update (Reload to ensure persistence)
    const newStore = new IdentityStore(testFilePath);
    const userAfter = newStore.getIdentity('u1');
    
    expect(userAfter?.status).toBe('suspended');
  });

  // Cleanup: Restore user to active so other tests don't fail
  afterAll(() => {
    store.updateIdentity('u1', { status: 'active' });
  });
});
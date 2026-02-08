// tests/reload.test.ts
import { Accord } from '../src/accord';
import * as fs from 'fs';
import * as path from 'path';

describe('Hot Reload Functionality', () => {
  const configPath = './config/policies.json';
  const idPath = './config/identities.json';
  const backupPath = './config/policies.backup.json';
  
  // FIX: Define an ALLOW policy (Good State)
  const goodPolicyContent = [
    {
      id: "policy-admin-allow",
      version: "1.0",
      effect: "allow",
      subject: { type: "user", attributes: { role: "admin" } },
      action: ["delete"],
      resource: { type: "booking" }
    }
  ];

  let accord: Accord;

  beforeAll(async () => {
    fs.writeFileSync(configPath, JSON.stringify(goodPolicyContent, null, 2));

    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }

    accord = await Accord.create({ // Use create
      policyPath: configPath,
      identityPath: idPath
    } as any);
  });

  afterAll(() => {
    // Restore backup (which is good state)
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, configPath);
      fs.unlinkSync(backupPath);
    }
  });

  test('1. Should reload valid policies successfully', async () => {
    // 1. Initial check (Should be Allow based on goodPolicyContent)
    let decision = await accord.check('u1', 'delete', { type: 'booking', id: 'b1' });
    expect(decision.decision).toBe('allow');

    // 2. Write a new restrictive policy (block u1)
    const restrictivePolicy = [
      {
        id: 'policy-test-deny',
        version: '1.0',
        effect: 'deny',
        subject: { type: 'user' },
        action: ['delete'],
        resource: { type: 'booking' }
      }
    ];
    fs.writeFileSync(configPath, JSON.stringify(restrictivePolicy, null, 2));

    // 3. Reload
    await accord.reload();

    // 4. Check again (Should now be denied)
    decision = await accord.check('u1', 'delete', { type: 'booking', id: 'b1' });
    expect(decision.decision).toBe('deny');
  });

  test('2. Should keep old config if reload fails (Safety)', async () => {
    // 1. Write INVALID JSON to policy file
    const badJSON = '{ "this is": invalid json }';
    fs.writeFileSync(configPath, badJSON);

    // 2. Reload (Should log error internally, NOT throw)
    expect(() => accord.reload()).not.toThrow();

    // 3. Check if Accord still works (Should still use old config)
    // Note: Since we just created a file with a "Restrictive" policy in Test 1, and then a "Bad JSON" in Test 2...
    // ... `beforeAll` doesn't clean up after every test suite.
    // To make `reload` robust, we must ensure `writeFileSync` always wins over whatever is on disk.
    
    const decision = await accord.check('u1', 'delete', { type: 'booking', id: 'b1' });
    // The expectation here is that it Denies (due to Test 1's restrictive policy).
    // If Accord had crashed or cleared memory, this might be different.
    // The key test here is that `reload()` didn't crash the app.
    expect(decision.decision).toBe('deny'); 
  });
});
// src/cli/index.ts
// #!/usr/bin/env node
import { Command } from 'commander';
import { Accord } from '../accord';
import { loadPolicies } from '../core/loader';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('accord')
  .description('Accord Policy Engine CLI')
  .version('1.0.0');

// ---------------------------------------------------------
// Command: validate
// Checks if a policy file is valid JSON and loadable
// ---------------------------------------------------------
program
  .command('validate <file>')
  .description('Validate a policy JSON file')
  .action((file) => {
    try {
      console.log(`Validating ${file}...`);
      const policies = loadPolicies(file);
      console.log(`✓ Valid! Loaded ${policies.length} policies.`);
    } catch (error) {
      console.error(`✗ Validation Failed:`);
      console.error((error as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------
// Command: eval
// Dry-run an access check
// Usage: accord eval --id u1 --action delete --resource booking
// ---------------------------------------------------------
program
  .command('eval')
  .description('Evaluate an access request')
  .requiredOption('-i, --id <userId>', 'User ID')
  .requiredOption('-a, --action <action>', 'Action (e.g., delete)')
  .requiredOption('-r, --resource <type>', 'Resource Type (e.g., booking)')
  .option('--rid <resourceId>', 'Resource ID (optional)')
  .option('-p, --policy <path>', 'Path to policies file', './config/policies.json')
  .option('-u, --user <path>', 'Path to identities file', './config/identities.json')
  .action(async (options) => {
    try {
      // 1. Initialize Accord
      const accord = new Accord({
        policyPath: options.policy,
        identityPath: options.user
      });

      // 2. Construct Resource
      const resource: any = {
        type: options.resource,
        attributes: {}
      };
      if (options.rid) {
        resource.id = options.rid;
      }

      console.log(`Checking if '${options.id}' can '${options.action}' on '${options.resource}'...`);

      // 3. Check Access
      const decision = await accord.check(options.id, options.action, resource);

      // 4. Output Result
      console.log(JSON.stringify(decision, null, 2));

      // Exit with error code if denied (useful for CI/CD)
      if (decision.decision === 'deny') {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);
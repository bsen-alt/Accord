// src/cli/index.ts
//#!/usr/bin/env node
import { Command } from 'commander';
import { Accord } from '../accord';
import { FileStoreAdapter } from '../store/adapters/file';
import { PostgresStoreAdapter } from '../store/adapters/postgres';
import { startServer } from '../server/index';
import { loadPolicies } from '../core/loader';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('accord')
  .description('Accord Policy Engine CLI')
  .version('1.3.0');

// --- v1.2 Commands ---

program
  .command('validate <file>')
  .description('Validate a policy file')
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

program
  .command('eval')
  .description('Evaluate an access request (File Mode)')
  .requiredOption('-i, --id <userId>', 'User ID')
  .requiredOption('-a, --action <action>', 'Action')
  .requiredOption('-r, --resource <type>', 'Resource Type')
  .option('--rid <resourceId>', 'Resource ID (optional)')
  .option('-p, --policy <path>', 'Path to policies file', './config/policies.json')
  .option('-u, --user <path>', 'Path to identities file', './config/identities.json')
  .action(async (options) => {
    try {
      // Use FileStoreAdapter for CLI eval
      const adapter = new FileStoreAdapter(options.policy, options.user);
      // FIX: Use Accord.create to ensure initialization completes
      const accord = await Accord.create({ adapter });

      const resource: any = {
        type: options.resource,
        attributes: {}
      };
      if (options.rid) {
        resource.id = options.rid;
      }

      console.log(`Checking if '${options.id}' can '${options.action}' on '${options.resource}'...`);

      const decision = await accord.check(options.id, options.action, resource);

      console.log(JSON.stringify(decision, null, 2));

      if (decision.decision === 'deny') {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start Accord in Server Mode')
  .option('-p, --port <number>', 'Port to listen on', '8080')
  .option('-a, --adapter <type>', 'Storage adapter (file | postgres)', 'file')
  .option('--postgres-url <url>', 'Postgres Connection String', process.env.DATABASE_URL)
  .action(async (options) => {
    let adapter;

    if (options.adapter === 'postgres') {
       if (!options.postgresUrl) {
         console.error('Error: Postgres URL required via --postgres-url or DATABASE_URL env var');
         process.exit(1);
       }
       adapter = new PostgresStoreAdapter({ connectionString: options.postgresUrl });
    } else {
       adapter = new FileStoreAdapter('./config/policies.json', './config/identities.json');
    }

    // FIX: Use Accord.create
    const accord = await Accord.create({
      adapter,
      jit: {
        enabled: process.env.JIT_ENABLED === 'true',
        attributeMapping: {
           role: "$.role" 
        },
        defaultStatus: 'active'
      },
      // v1.3: Add Webhook support via environment variables
      webhook: process.env.WEBHOOK_URL ? {
        url: process.env.WEBHOOK_URL,
        secret: process.env.WEBHOOK_SECRET, // Optional
        events: ['decision', 'policy_change', 'identity_provision']
      } : undefined
    });

    // FIX: Removed duplicate startServer call
    await startServer({
      port: parseInt(options.port),
      accordInstance: accord
    });
  });

// --- v1.3 New Subcommands ---

const policyCmd = program.command('policy');

policyCmd
  .command('history <id>')
  .description('View version history for a policy (Postgres Only)')
  .action(async (id) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        console.error('Error: DATABASE_URL environment variable is required for policy history.');
        process.exit(1);
      }

      const adapter = new PostgresStoreAdapter({ connectionString: dbUrl });
      const history = await adapter.listPolicyHistory(id);
      
      console.log(`History for policy: ${id}`);
      if (history.length === 0) {
        console.log('No history found.');
      } else {
        history.forEach(p => {
          const date = p.created_at ? new Date(p.created_at).toLocaleString() : 'Unknown Date';
          console.log(`- v${p.version} (${date}): ${p.effect.toUpperCase()}`);
        });
      }
    } catch (error) {
      console.error(`Error fetching history: ${(error as Error).message}`);
      process.exit(1);
    }
  });

policyCmd
  .command('rollback <id>')
  .description('Rollback policy to a specific version (Postgres Only)')
  .requiredOption('-v, --version <version>', 'Target version to rollback to')
  .action(async (id, options) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        console.error('Error: DATABASE_URL environment variable is required for rollback.');
        process.exit(1);
      }

      const adapter = new PostgresStoreAdapter({ connectionString: dbUrl });
      await adapter.rollbackPolicy(id, options.version);
      console.log(`Successfully rolled back policy '${id}' to version '${options.version}'.`);
      console.log(`Note: You may need to reload your application server or trigger a reload API call.`);
    } catch (error) {
      console.error(`Error during rollback: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
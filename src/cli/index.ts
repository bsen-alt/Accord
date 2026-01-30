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
  .version('1.2.0');

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
  .description('Evaluate an access request')
  .requiredOption('-i, --id <userId>', 'User ID')
  .requiredOption('-a, --action <action>', 'Action')
  .requiredOption('-r, --resource <type>', 'Resource Type')
  .option('--rid <resourceId>', 'Resource ID (optional)')
  .option('-p, --policy <path>', 'Path to policies file', './config/policies.json')
  .option('-u, --user <path>', 'Path to identities file', './config/identities.json')
  .action(async (options) => {
    try {
      // FIX: Use FileStoreAdapter for CLI eval
      const adapter = new FileStoreAdapter(options.policy, options.user);
      const accord = new Accord({ adapter });

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

    const accord = new Accord({
      adapter,
      jit: {
        enabled: process.env.JIT_ENABLED === 'true',
        attributeMapping: {
           role: "$.role" 
        },
        defaultStatus: 'active'
      }
    });

    await startServer({
      port: parseInt(options.port),
      accordInstance: accord
    });
  });

program.parse(process.argv);
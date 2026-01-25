# Getting Started

Welcome to **Accord v1.1**. This guide will walk you through installing Accord, configuring your first policy, and performing your first authorization check in less than 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher)
- **npm** or **yarn**

## 1. Installation

Install the Accord package via npm:

```bash
npm install @navirondynamics/accord
```

## 2. Create Configuration

Accord needs two pieces of information to make decisions:

1. **Identities:** Who are your users and services?
2. **Policies:** What are they allowed to do?

Create a folder named `config` in your project root.

### Define Identities

Create `config/identities.json`. This file represents your internal users.

```json
[
  {
    "id": "alice",
    "type": "user",
    "status": "active",
    "attributes": {
      "role": "admin",
      "department": "sales"
    }
  },
  {
    "id": "bob",
    "type": "user",
    "status": "active",
    "attributes": {
      "role": "viewer",
      "department": "sales"
    }
  }
]
```

### Define Policies

Create `config/policies.json`. This file defines your access rules.

_In this example, we will allow users with the `admin` role to delete bookings._

```json
[
  {
    "id": "policy-admin-delete",
    "version": "1.0",
    "effect": "allow",
    "subject": {
      "type": "user",
      "attributes": {
        "role": "admin"
      }
    },
    "action": ["delete"],
    "resource": {
      "type": "booking"
    }
  }
]
```

> **Tip:** In Accord v1.1, you can also use **YAML** files (`config/policies.yaml`) for better readability.

## 3. Initialize Accord

Import Accord and initialize it by pointing it to your config files.

```javascript
const { Accord } = require('@navirondynamics/accord');

// Initialize the engine
const accord = new Accord({
  policyPath: './config/policies.json',
  identityPath: './config/identities.json',
  // In v1.1, Accord uses a ConsoleAuditLogger by default,
  // so you will see decisions in your terminal automatically.
});
```

## 4. Perform an Access Check

Now, let's ask Accord a question: **"Can Alice delete Booking #123?"**

```javascript
async function main() {
  // 1. Check Access
  // Args: userId, action, resourceObject
  const decision = await accord.check('alice', 'delete', {
    type: 'booking',
    id: 'b123',
    attributes: {},
  });

  // 2. Handle Result
  if (decision.decision === 'allow') {
    console.log('✅ Access Granted');
    console.log(`Reason: ${decision.policy_id}`);
  } else {
    console.log('❌ Access Denied');
    console.log(`Reason: ${decision.reason}`);
  }

  // -----------------------------------------------------
  // Let's try a user who should NOT have permission (Bob)
  // -----------------------------------------------------
  const bobDecision = await accord.check('bob', 'delete', {
    type: 'booking',
    id: 'b123',
  });

  if (bobDecision.decision === 'deny') {
    console.log('Bob was denied (as expected).');
  }
}

main();
```

## 5. Observe the Output

When you run this script, Accord v1.1 will automatically log decisions to your console:

```text
[ALLOW] alice -> delete on booking/b123 | Policy: policy-admin-delete
[ALLOW] Alice -> Access Granted
Bob was denied (as expected).
[DENY] bob -> delete on booking/b123 | Reason: No matching policy found (Default Deny)
```

## What's Next?

You have successfully integrated Accord!

- **Configuration:** Learn how to use [YAML](02-configuration.md) or advanced [RBAC/ABAC rules](02-configuration.md).
- **Observability:** Learn how to set up [File Logging for Production](03-audit-logging.md).
- **Integration:** See how to use Accord with [Express, NestJS, or Fastify](04-adapters.md).

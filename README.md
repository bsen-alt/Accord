# Accord

**Accord** is a policy-first identity and access engine designed to unify identity representation, context resolution, and authorization under a single, declarative model.

It treats access not as scattered checks embedded in application code, but as a **formal agreement** between identities, systems, and resources.

## 🧠 The System of Agreement

Modern authorization is often fragmented:

- Authentication handled in one service.
- Roles defined in another.
- Access logic scattered across codebases.

**Accord** reframes this as a governance layer. Instead of embedding `if (user.admin)` checks, Accord externalizes rules into explicit, versioned policies.

- **Explicit:** Access rules are defined before execution.
- **Inspectable:** Every decision returns a reason.
- **Centralized:** One source of truth for multiple services.

## 📦 Installation

```bash
npm install @navirondynamics/accord
```

## 🚀 Quick Start

### 1. Define Your Configuration

Create a `config` folder in your project root.

**`config/policies.json`**

```json
[
  {
    "id": "policy-admin",
    "version": "1.0",
    "effect": "allow",
    "subject": {
      "type": "user",
      "attributes": { "role": "admin" }
    },
    "action": ["delete"],
    "resource": { "type": "booking" }
  }
]
```

**`config/identities.json`**

```json
[
  {
    "id": "alice",
    "type": "user",
    "status": "active",
    "attributes": { "role": "admin" }
  }
]
```

### 2. Use in Your Code

```javascript
const { Accord } = require('@navirondynamics/accord');

// 1. Initialize the Engine
const accord = new Accord({
  policyPath: './config/policies.json',
  identityPath: './config/identities.json',
});

async function deleteBooking(bookingId, userId) {
  // 2. Check Access
  const decision = await accord.check(userId, 'delete', {
    type: 'booking',
    id: bookingId,
  });

  // 3. Enforce Decision
  if (decision.decision === 'allow') {
    console.log('Access Granted');
    // Perform delete...
  } else {
    console.log('Access Denied:', decision.reason);
  }
}

deleteBooking('b1', 'alice');
```

## 🛡️ Express Middleware

Protect your routes without cluttering your controller logic.

```javascript
const express = require('express');
const { Accord } = require('@navirondynamics/accord');
const { protect } = require('@navirondynamics/accord/adapters/express');

const app = express();
const accord = new Accord({
  policyPath: './config/policies.json',
  identityPath: './config/identities.json',
});

// Protect this route
app.delete(
  '/bookings/:id',
  protect({
    accordInstance: accord,
    action: 'delete',
    resourceType: 'booking',
  }),
  (req, res) => {
    // Only allowed users reach here
    res.send('Booking deleted');
  }
);

app.listen(3000);
```

## 🛠️ CLI Tool

Validate policies and test access logic from your terminal.

**Validate Configuration:**

```bash
npx @navirondynamics/accord validate ./config/policies.json
```

**Dry-Run Access Check:**

```bash
npx @navirondynamics/accord eval -i alice -a delete -r booking
```

## ⚙️ Core Concepts

- **Identity:** Represents who is acting (User, Service, Agent). Includes a `status` (active/suspended) allowing for a "Kill Switch".
- **Resource:** Represents what is being accessed.
- **Policy:** The agreement linking Identity, Action, and Resource. Supports RBAC (Roles) and ABAC (Attributes).
- **Decision:** The output (`allow`/`deny`) including a `reason` for auditing.

## 📜 License

ISC

```

```

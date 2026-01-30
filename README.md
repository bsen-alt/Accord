# Accord

<p align="center">
  <a href="https://www.npmjs.com/package/@navirondynamics/accord">
    <img src="https://img.shields.io/npm/v/@navirondynamics/accord.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@navirondynamics/accord">
    <img src="https://img.shields.io/npm/dm/@navirondynamics/accord.svg" alt="npm downloads" />
  </a>
  <a href="https://github.com/bsen-alt/Accord">
    <img src="https://img.shields.io/github/license/bsen-alt/Accord" alt="license" />
  </a>
</p>

Accord is a **policy-first identity and access platform for Node.js**.

It treats access not as scattered application logic, but as a formal agreement between identities, systems, and resources - evaluated through declarative, versioned policies.

**New in v1.2:** Database-first persistence, Standalone Server Mode, JIT provisioning, and Explainable Decision Traces.

---

## Table of Contents

- [Why Accord](#-why-accord)
- [Key Features](#key-features)
- [Installation](#-installation)
- [Quick Start (Server Mode)](#-quick-start-server-mode)
- [Usage (Library Mode)](#-usage-library-mode)
- [Framework Integration](#-framework-integration)
- [CLI Tool](#-cli-tool)
- [Documentation](#-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Why Accord?

v1.1 was a library. v1.2 is a platform.

Modern authorization is fragmented:

- Authentication in one service
- Roles in another
- Access logic scattered across microservices

Accord centralizes authorization into a single **governance layer**, acting as the _System of Record_ for access control across your platform.

**"ACCORD v1.2 turns authorization from scattered code into a centralized, explainable control plane-without becoming an IdP or middleware."**

---

## Key Features

- 🚀 **Platform Mode** – Standalone HTTP server for centralized decision making.
- 🗄️ **Database-First** – Pluggable storage adapters (Postgres, File) with JSONB optimization.
- 🤝 **JIT Provisioning** – Automatic identity creation on first login.
- 📊 **Explainability** – Full decision traces (latency, matched policies) for debugging.
- 🔍 **Observability** – Built-in audit logging (console & file).
- 📝 **Policy as Code** – JSON and YAML configuration support.
- 🛡️ **Reliability** – Zod-based schema validation.
- 🧩 **Framework Adapters** – Express, NestJS, and Fastify integrations.

---

## 📦 Installation

```bash
npm install @navirondynamics/accord
```

````

---

## 🛠️ Quick Start (Server Mode)

The fastest way to experience v1.2 is running Accord as a standalone service.

### 1. Configure Environment

Create a `.env` file:

```env
DATABASE_URL=postgres://user:password@localhost:5432/accord
PORT=8080
JIT_ENABLED=true
```

### 2. Run the Server

```bash
npx @navirondynamics/accord serve --adapter postgres
```

### 3. Create a Policy

```bash
curl -X POST http://localhost:8080/api/v1/policies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "policy-view-all",
    "version": "1.2",
    "effect": "allow",
    "subject": { "type": "user" },
    "action": ["view"],
    "resource": { "type": "document" }
  }'
```

### 4. Check Access

```bash
curl -X POST http://localhost:8080/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "alice",
    "action": "view",
    "resource": { "type": "document" }
  }'
```

_Result: Alice is automatically created (JIT) and allowed._

---

## 🧩 Usage (Library Mode)

You can also embed Accord directly into your Node.js applications.

```javascript
const { Accord, PostgresStoreAdapter } = require('@navirondynamics/accord');

// 1. Initialize Storage
const adapter = new PostgresStoreAdapter({
  connectionString: process.env.DATABASE_URL,
});

// 2. Initialize Accord
const accord = new Accord({
  adapter,
  jit: { enabled: true, defaultStatus: 'active' },
});

// 3. Check Access
const decision = await accord.check('alice', 'view', { type: 'document' });

if (decision.decision === 'allow') {
  console.log(`Allowed by ${decision.policy_id}`);
  console.log(`Latency: ${decision.trace.latencyMs}ms`);
}
```

---

## 🛡️ Framework Integration

Accord integrates seamlessly with Express, NestJS, and Fastify.

### NestJS

```typescript
import { AccordGuard } from '@navirondynamics/accord/adapters/nest';

@Controller('bookings')
export class BookingController {
  @UseGuards(
    new AccordGuard({
      accordInstance: accord, // Use your Accord instance
      action: 'delete',
      resourceType: 'booking',
    })
  )
  @Delete(':id')
  deleteBooking(@Param('id') id: string) {
    // Only authorized users reach here
  }
}
```

### Express

```javascript
const { protect } = require('@navirondynamics/accord/adapters/express');

app.delete(
  '/bookings/:id',
  protect({
    accordInstance: accord,
    action: 'delete',
    resourceType: 'booking',
  }),
  (req, res) => {
    res.send('Deleted');
  }
);
```

---

## 🔧 CLI Tool

Validate policies or run the server directly from your terminal.

```bash
# Run the Platform Server
npx @navirondynamics/accord serve --adapter postgres --port 8080

# Validate a local policy file
npx @navirondynamics/accord validate ./config/policies.yaml

# Dry-run a check (File mode)
npx @navirondynamics/accord eval -i user_123 -a delete -r booking
```

---

## 📚 Documentation

- **Getting Started** – Installation and core concepts
- **Platform vs Library** – Choosing the right deployment mode
- **Observability** – Interpreting Decision Traces
- **JIT Provisioning** – Configuring identity mapping
- **Adapters** – Setting up Postgres or File storage
- **API Reference** – Management API documentation

---

## 🗺️ Roadmap

**Current (v1.2)**

- ✅ Standalone Server Mode
- ✅ Postgres Storage Adapter
- ✅ JIT Identity Provisioning
- ✅ Explainable Decision Traces

**Next (v1.3+)**

- 🚧 Identity Caching for ultra-low latency
- 🚧 Terraform Provider for Infrastructure-as-Code
- 🚧 Webhooks on Policy Change
- 🚧 Web-based Policy Editor UI
- 🚧 Multi-region replication

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

Please ensure tests pass and documentation is updated.

---

## 📜 License

ISC

```

```
````

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

Accord is a **policy-first identity and access engine for Node.js**.

It treats access not as scattered application logic, but as a formal agreement between identities, systems, and resources - evaluated through declarative, versioned policies.

**New in v1.1:** Observability, YAML configuration, hot reload, and native NestJS support.

---

## Table of Contents

- [Why Accord](#-why-accord)
- [Key Features](#key-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start-v11)
- [Framework Integration](#-framework-integration)
- [CLI Tool](#-cli-tool)
- [Documentation](#-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Why Accord?

Modern authorization is fragmented:

- Authentication in one service
- Roles in another
- Access logic scattered across microservices

Accord centralizes authorization into a single **governance layer**, acting as the _System of Record_ for access control across your platform.

Instead of embedding authorization logic throughout your codebase, Accord externalizes it into auditable, inspectable, and versioned policy definitions.

---

## Key Features

- 🔍 **Observability** – Built-in audit logging (console & file)
- 📝 **Policy as Code** – JSON and YAML configuration support
- 🛡️ **Reliability** – Zod-based schema validation to prevent invalid policies
- 🔄 **Zero-Downtime Updates** – Hot reload policies without restarting services
- 🧩 **Framework Adapters** – Express, NestJS, and Fastify integrations
- 📦 **CLI Tooling** – Validate and simulate access decisions locally

---

## 📦 Installation

```bash
npm install @navirondynamics/accord
```

---

## 🛠️ Quick Start (v1.1)

### 1. Define Policies (YAML supported)

Create `config/policies.yaml`:

```yaml
- id: 'admin-delete'
  version: '1.1'
  effect: 'allow'
  subject:
    type: 'user'
    attributes:
      role: 'admin'
  action: ['delete']
  resource:
    type: 'booking'
```

---

### 2. Initialize Accord

```javascript
const { Accord, ConsoleAuditLogger } = require('@navirondynamics/accord');

const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
  logger: new ConsoleAuditLogger(),
});
```

---

### 3. Check Access

```javascript
async function deleteUser(userId) {
  const decision = await accord.check(userId, 'delete', {
    type: 'user',
    id: userId,
  });

  if (decision.decision === 'allow') {
    console.log('Permission Granted');
    // Perform deletion...
  } else {
    console.log('Access Denied:', decision.reason);
  }
}
```

---

## 🛡️ Framework Integration

### NestJS

```typescript
import { AccordGuard } from '@navirondynamics/accord/adapters/nest';

@Controller('bookings')
export class BookingController {
  @UseGuards(
    new AccordGuard({
      accordInstance: accord,
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

---

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

Fastify support and advanced usage are available in the adapters documentation.

---

## 🔧 CLI Tool

Validate policies or simulate access decisions directly from your terminal.

```bash
# Validate policy syntax
npx @navirondynamics/accord validate ./config/policies.yaml

# Test access logic
npx @navirondynamics/accord eval -i user_123 -a delete -r booking
```

---

## 📚 Documentation

- **Getting Started** – Installation and core concepts
- **Configuration Guide** – Identities, policies, JSON vs YAML
- **Observability & Auditing** – Production logging setup
- **Framework Adapters** – Express, NestJS, Fastify usage
- **CLI Reference** – Full command list

---

## 🗺️ Roadmap

Planned improvements:

- Policy versioning & rollback
- Database-backed policy storage
- Web-based policy editor
- Decision caching
- OpenTelemetry tracing
- Distributed policy synchronization

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

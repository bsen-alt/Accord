# Framework Adapters

Accord is designed to be framework-agnostic. However, to integrate it easily into your existing web applications, we provide **Official Adapters** for the three most popular Node.js frameworks:

1.  **Express**
2.  **NestJS**
3.  **Fastify**

These adapters handle the heavy lifting: extracting the User ID, constructing the Resource object from request parameters, and enforcing the Decision (Allow/Deny) via standard HTTP status codes.

---

## 1. Express Middleware

The Express adapter acts as standard middleware. If the policy evaluation is `deny`, it automatically sends a `403 Forbidden` response.

### Installation

No extra installation needed if you installed `@navirondynamics/accord`.

### Usage

```javascript
const express = require('express');
const { Accord } = require('@navirondynamics/accord');
const { protect } = require('@navirondynamics/accord/adapters/express');

const app = express();

// 1. Initialize Accord (Do this once)
const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
  logger: new FileAuditLogger('./logs/audit.log'), // Ensure we audit
});

// 2. Helper: Get User ID from a JWT Middleware
// Assuming 'authenticate-jwt' middleware puts user info on req.user
const getIdFromRequest = (req) => {
  return req.user?.id || req.headers['x-user-id'];
};

// 3. Protect a Route
app.delete(
  '/bookings/:id',
  // Pass the Accord instance, action, and resource type
  protect({
    accordInstance: accord,
    action: 'delete',
    resourceType: 'booking',
    // Optional: Custom ID extractor
    getId: getIdFromRequest,
  }),
  (req, res) => {
    // Only authorized users reach here
    res.send(`Booking ${req.params.id} deleted.`);
  }
);

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Deny Response

If the user is denied, Express automatically responds with:

```json
{
  "error": "Access Denied",
  "reason": "Identity user_123 is suspended. Access denied."
}
```

---

## 2. NestJS Guard

The NestJS adapter implements the standard `CanActivate` interface. It fits seamlessly into Nest's Dependency Injection and Controller Guards system.

### Usage

```typescript
import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { Accord } from '@navirondynamics/accord';
import { AccordGuard } from '@navirondynamics/accord/adapters/nest';

// 1. Initialize Accord (often in a Service)
const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
});

@Controller('bookings')
export class BookingController {
  // 2. Protect specific methods with the Guard
  @Delete(':id')
  @UseGuards(
    new AccordGuard({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking',
      // Optional: Custom ID extractor from the Request object
      getId: (req) => req.user?.sub,
    })
  )
  async deleteBooking(@Param('id') id: string) {
    // Logic here runs only if Guard returned true
    return { message: `Booking ${id} deleted` };
  }
}
```

### Note on `getId`

In NestJS, you likely have an Authentication Guard (like JWT) running before this one. You can access the decoded payload via `req.user`.

---

## 3. Fastify Hook

The Fastify adapter implements a global or scoped `onRequest` hook. It utilizes Fastify's request-reply lifecycle.

### Usage

```javascript
const Fastify = require('fastify');
const { Accord } = require('@navirondynamics/accord');
const { accordHook } = require('@navirondynamics/accord/adapters/fastify');

const fastify = Fastify({ logger: true });

// 1. Initialize Accord
const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
});

// 2. Register the Hook
fastify.register(async function (fastify) {
  fastify.addHook(
    'onRequest',
    accordHook({
      accordInstance: accord,
      action: 'delete',
      resourceType: 'booking',
      getId: (req) => req.user?.id || req.headers['x-user-id'],
    })
  );

  // 3. Define Route
  fastify.delete('/bookings/:id', async (request, reply) => {
    // This runs only if the hook passed
    return { message: 'Deleted' };
  });
});

fastify.listen({ port: 3000 });
```

---

## Advanced: Context Injection

Sometimes policies depend on dynamic request data (e.g., checking the user's IP address or a tenant ID).

The adapters automatically extract the following from the request:

1.  **Resource ID:** From `req.params.id` (or `req.params` generally).
2.  **Resource Attributes:** From `req.body`.

**Example Request Body:**

```json
POST /bookings/b1
{
  "tenant_id": "acme-corp"
}
```

**The adapter will pass this to Accord:**

```javascript
await accord.check(userId, 'update', {
  type: 'booking',
  id: 'b1',
  attributes: {
    tenant_id: 'acme-corp', // <-- Used by ABAC policies
  },
});
```

**Example Policy:**

```yaml
# Allow only if user's attribute matches the body's tenant_id
subject:
  attributes:
    tenant_id: 'acme-corp'
resource:
  type: 'booking'
  attributes:
    tenant_id: 'acme-corp'
action: ['update']
```

---

## Best Practices

1.  **Singleton:** Initialize `new Accord()` once at application startup (bootstrapping phase), not inside every request handler. This keeps policy loading and compilation efficient.
2.  **Audit Logs:** Remember that the `AuditLogger` you passed to `Accord` will fire on **every** request protected by these adapters.
3.  **Authentication vs. Authorization:** These adapters handle Authorization (**Can I do this?**). Ensure you run your Authentication middleware (JWT validation, Sessions) **before** the Accord adapter so that `req.user` or headers are populated.

---

## What's Next?

- **CLI:** Learn how to validate your configuration before deploying [CLI Reference](05-cli-reference.md).

```

```

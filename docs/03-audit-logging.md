# Observability & Audit Logging

In Accord v1.1, every access decision—whether **Allow** or **Deny**—generates an immutable **Audit Event**.

This is critical for enterprise environments for three reasons:

1.  **Compliance:** Meeting requirements (SOC2, HIPAA, GDPR) to prove who accessed what and when.
2.  **Security:** Detecting brute-force attempts or suspicious Deny patterns.
3.  **Debugging:** Understanding _why_ a specific user was denied access during development.

---

## The Audit Logger Interface

Accord does not hardcode logging logic. Instead, it relies on the `AuditLogger` interface. This allows you to route logs to the console, a file, or a cloud provider (Splunk, Datadog, etc.).

### The Audit Event Structure

Regardless of where you send the logs, the data shape is always consistent:

| Field            | Type    | Description                                                          |
| :--------------- | :------ | :------------------------------------------------------------------- |
| **timestamp**    | Date    | ISO 8601 timestamp of the decision.                                  |
| **decision**     | String  | `allow` or `deny`.                                                   |
| **policyId**     | String? | (If Allow) The ID of the policy that permitted access.               |
| **reason**       | String? | (If Deny) The reason for rejection (e.g., "Suspended", "No policy"). |
| **userId**       | String  | The ID of the identity requesting access.                            |
| **action**       | String  | The action attempted (e.g., "delete").                               |
| **resourceType** | String  | The type of resource accessed.                                       |
| **resourceId**   | String? | The specific ID of the resource (if provided).                       |

---

## 1. Console Logging (Development)

By default, Accord uses the `ConsoleAuditLogger`. It provides color-coded output for quick visual feedback.

**Configuration:**

```javascript
const { Accord, ConsoleAuditLogger } = require('@navirondynamics/accord');

const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
  // Explicitly setting it (optional, as it is the default)
  logger: new ConsoleAuditLogger(),
});
```

**Output Example:**

```text
✅ [ALLOW] alice -> delete on booking/b123 | Policy: policy-admin-delete
❌ [DENY] bob -> delete on booking/b123 | Reason: No matching policy found (Default Deny)
```

---

## 2. File Logging (Production)

For production environments, you need a persistent record. Accord ships with a `FileAuditLogger` that writes events in **JSON Lines** format.

### Why JSON Lines?

JSON Lines (newline-delimited JSON) is the standard for log aggregators like Splunk, ELK Stack, or Datadog. It allows tools to parse every line individually without reading the whole file.

### Configuration

```javascript
const { Accord, FileAuditLogger } = require('@navirondynamics/accord');
const path = require('path');

const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',

  // Append-only writes to file
  logger: new FileAuditLogger(path.join(__dirname, 'logs', 'audit.log')),
});
```

### Log File Content Example

`logs/audit.log`

```json
{"timestamp":"2024-05-20T10:00:00.000Z","decision":"allow","policyId":"policy-admin-delete","userId":"alice","action":"delete","resourceType":"booking","resourceId":"b123"}
{"timestamp":"2024-05-20T10:00:05.000Z","decision":"deny","reason":"Identity bob is suspended. Access denied.","userId":"bob","action":"delete","resourceType":"booking","resourceId":"b123"}
```

### Operational Tips

- **Rotation:** Accord does not perform log rotation automatically. Use OS tools (like `logrotate` on Linux) or a service (like PM2) to manage file size.
- **Permissions:** Ensure the Node process has write permissions to the log directory.
- **I/O Blocking:** The file logger uses synchronous writes (`appendFileSync`) to ensure logs are never lost in the event of a crash. In extremely high-throughput scenarios (>10k req/s), consider using a custom async logger.

---

## 3. Custom Loggers (Splunk, Datadog, Cloud)

Enterprises often push logs directly to a collector rather than a local file. You can achieve this by implementing the `AuditLogger` interface.

### Example: Sending to a Mock Cloud API

```javascript
const { Accord, AuditLogger } = require('@navirondynamics/accord');

class CloudAuditLogger extends AuditLogger {
  async log(event) {
    // 1. Format for your provider
    const payload = {
      source: 'accord',
      sourcetype: 'json',
      event: event,
    };

    // 2. Send to HTTP endpoint (non-blocking in real world)
    // Ideally, use a buffer or message queue here
    try {
      // Example: fetch('https://logs.mycompany.com/ingest', {
      //   method: 'POST',
      //   body: JSON.stringify(payload)
      // });
      console.log(`[Cloud Log Sent] Decision: ${event.decision}`);
    } catch (err) {
      console.error('Failed to send audit log:', err);
    }
  }
}

// Usage
const accord = new Accord({
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
  logger: new CloudAuditLogger(),
});
```

This allows Accord to integrate seamlessly into your existing observability stack without changing core application logic.

---

## What's Next?

- **Integration:** Now that you have logs flowing, see how to enforce these policies in your [Framework Adapters](04-adapters.md).
- **CLI:** Learn how to [Validate Configs](05-cli-reference.md) before deploying.

```

```

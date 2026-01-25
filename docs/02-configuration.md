# Configuration Guide

Accord v1.1 separates configuration into two distinct concepts: **Identities** (Who) and **Policies** (The Agreement).

## Supported Formats

Accord v1.1 natively supports **JSON** and **YAML**.

- **JSON:** Standard for machine-generated config.
- **YAML:** Recommended for human-authored policies due to better readability and comment support.
- **Mixed Mode:** You can load from multiple sources (e.g., `identities.json` + `policies.yaml`).

> **Note:** All configuration files are validated using **Zod** on startup. If your syntax is invalid, Accord will throw an error before processing any requests.

---

## 1. Identities Configuration

Identities are your "System of Record." While Auth0/Okta might handle the _login_, Accord defines who the user is inside _your_ system.

### File: `config/identities.json`

```json
[
  {
    "id": "user_123",
    "type": "user",
    "status": "active",
    "attributes": {
      "role": "editor",
      "department": "marketing",
      "tier": "premium"
    }
  },
  {
    "id": "service_bot",
    "type": "service",
    "status": "active",
    "attributes": {
      "access_level": "read_only"
    }
  }
]
```

### Key Fields

| Field          | Type   | Description                                                                         |
| :------------- | :----- | :---------------------------------------------------------------------------------- |
| **id**         | String | The unique identifier (usually mapped from the IdP `sub` or `email`).               |
| **type**       | Enum   | `user`, `service`, `system`, or `agent`. Used for policy matching.                  |
| **status**     | Enum   | `active`, `suspended`, or `revoked`. **Suspended** acts as a global kill switch.    |
| **attributes** | Object | Free-form key-value pairs used for RBAC/ABAC matching (e.g., `role`, `department`). |

### The "Kill Switch"

If you change a user's status to `suspended` in this file, they are immediately denied access, even if their external IdP token is valid.

---

## 2. Policies Configuration

Policies define the **Agreement**. They describe _who_ can do _what_ to _which resource_.

### YAML Example (Recommended)

File: `config/policies.yaml`

```yaml
- id: 'admin-full-access'
  version: '1.1'
  effect: 'allow'
  subject:
    type: 'user'
    attributes:
      role: 'admin'
  action: ['*'] # Wildcard for all actions
  resource:
    type: '*' # Wildcard for all resources

- id: 'editor-can-publish'
  version: '1.1'
  effect: 'allow'
  subject:
    type: 'user'
    attributes:
      role: 'editor'
  action: ['publish', 'update']
  resource:
    type: 'article'
```

### JSON Example

File: `config/policies.json`

```json
[
  {
    "id": "policy-viewer-only",
    "version": "1.0",
    "effect": "allow",
    "subject": {
      "type": "user",
      "attributes": {
        "tier": "free"
      }
    },
    "action": ["read"],
    "resource": {
      "type": "article"
    }
  }
]
```

---

## 3. Advanced Policy Patterns

### RBAC (Role-Based Access Control)

Matching specific roles or groups.

**Policy:**

```yaml
subject:
  attributes:
    role: 'finance' # Only matches if user has role="finance"
action: ['approve', 'view-budget']
resource:
  type: 'expense_report'
```

### ABAC (Attribute-Based Access Control)

Matching based on dynamic data.

**Policy:**

```yaml
subject:
  attributes:
    department: 'sales'
action: ['read']
resource:
  type: 'lead'
  attributes:
    region: 'north-america' # Matches if resource has this attribute
```

---

## 4. Advanced Logic (Conditions)

Accord v1.1 supports **JSONata** expressions in the `condition` field. This allows for complex logic beyond simple attribute matching.

### Available Scope Variables

Inside a condition string, you have access to:

- `subject`: The identity object.
- `resource`: The resource object being accessed.
- `context`: The runtime context (optional, passed in `accord.check`).

### Example 1: Resource Ownership

Allow a user to update a document _only if they are the owner_.

**Resource Object:**

```json
{ "type": "document", "id": "doc_1", "attributes": { "owner_id": "user_55" } }
```

**Policy:**

```yaml
id: 'owner-update'
version: '1.1'
effect: 'allow'
subject:
  type: 'user'
action: ['update']
resource:
  type: 'document'
condition: 'subject.id = resource.attributes.owner_id'
```

### Example 2: IP Restriction (Contextual)

Allow access only if the request comes from a specific IP range.

**Policy:**

```yaml
id: 'internal-only'
version: '1.1'
effect: 'allow'
subject:
  type: 'user'
action: ['read']
resource:
  type: 'internal_record'
# Assumes 'context' passed in check() has { ip: "192.168.1.5" }
condition: "substring(context.ip, 1, 7) = '192.168'"
```

---

## 5. Loading Configuration

When initializing Accord, simply point to the file or directory.

```javascript
const accord = new Accord({
  // Auto-detects .json or .yaml
  policyPath: './config/policies.yaml',
  identityPath: './config/identities.json',
});
```

### Validation Errors

If your configuration fails Zod validation, Accord will throw an error like this:

```text
Error: Policy validation failed for ./config/policies.yaml
> Invalid Policy Structure:
> "effect": Invalid enum value. Expected 'allow' | 'deny', received 'permit'
```

This prevents bad rules from ever reaching your evaluation engine.

---

## What's Next?

- **Observability:** Now that your rules are set, learn how to [Log Decisions for Audits](03-audit-logging.md).
- **Integration:** Learn how to enforce these rules in [Express, Nest, or Fastify](04-adapters.md).

```

```

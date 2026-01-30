# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-30

### Added

- **Platform Mode**: Standalone HTTP Server (`accord serve`) for centralized control.
- **Storage Abstraction**: New `IStorageAdapter` interface enabling pluggable backends.
- **Postgres Adapter**: `PostgresStoreAdapter` with JSONB schema for enterprise scalability.
- **Explainability**: Added `DecisionTrace` to all responses for audit and debugging.
- **JIT Provisioning**: Automatic identity creation via `IdentityResolver` on first access.
- **Management API**: Full REST API for CRUD operations on Policies and Identities.
- **Lifecycle Hooks**: Support for `beforeDecision` and `afterDecision` middleware.

### Changed

- Policies are now stored in a database (when using Postgres adapter).
- Configuration moves from file paths to Adapter objects.
- Decision response now includes detailed trace information.

### Fixed

- Improved error handling for Postgres connection issues.
- Hot-reload triggers on Management API writes.

## [1.1.0] - 2026-01-25

### Added

#### Enterprise Observability

- Introduced **`AuditLogger`** interface for extensible logging strategies.
- Added **`ConsoleAuditLogger`**:
  - Color-coded output (Green for Allow, Red for Deny).
  - Perfect for local development and debugging.
- Added **`FileAuditLogger`**:
  - Append-only writes to `audit.log`.
  - JSON Lines format (newline-delimited JSON) for easy ingestion by Splunk, ELK, or Datadog.

#### Developer Experience (DX)

- **YAML Configuration Support**:
  - Native parsing for `.yaml` and `.yml` policy files.
  - Supports mixed environments (loading both JSON and YAML simultaneously).
- **Hot Reload Capability**:
  - Added `Accord.reload()` public method.
  - Updates policies and identities from disk without restarting the Node process.
  - Includes "Safe Fallback": If new config is invalid, Accord keeps running on the old config.
- **Enhanced CLI**:
  - `validate <file>`: Verify policy syntax and structure.
  - `eval`: Dry-run access checks directly from the terminal.

#### Reliability & Safety

- **Zod Schema Validation**:
  - All policies and identities are validated against strict schemas (`Schemas.Policy`, `Schemas.Identity`) at startup and reload.
  - Fails fast with descriptive error messages if configuration is malformed.
- **Safe Defaults**:
  - Empty or missing policy files now default to "Allow Nothing" instead of crashing the process.

#### Framework Adapters

- **NestJS Adapter**:
  - Implemented `AccordGuard` (implements `CanActivate`).
  - Usage: `@UseGuards(new AccordGuard({...}))`.
- **Fastify Adapter**:
  - Implemented `accordHook` (wraps `onRequest`).
  - Usage: `fastify.addHook('onRequest', accordHook({...}))`.
- **Express Adapter**:
  - Refined error handling to pass detailed decision reasons in the response body.

### Changed

- **`Accord` Constructor**:
  - Now accepts an optional `logger?: AuditLogger` in the `AccordConfig`.
  - Defaults to `ConsoleAuditLogger` if no logger is provided.
- **Policy Loading**:
  - Internal loader now auto-detects file extensions (`.json`, `.yaml`, `.yml`).

### Removed

- (None)

## [1.0.0] - Initial Release

### Added

- **Core Engine**: Policy evaluation and identity resolution.
- **Identity Runtime**: System of Record for internal identities (Users, Services, Agents).
- **Configuration**: JSON-based policy and identity definitions.
- **Evaluation Model**:
  - RBAC (Role-Based Access Control).
  - ABAC (Attribute-Based Access Control).
  - Explicit Deny-by-default semantics.
- **Adapters**: Basic Express Middleware.

```

```

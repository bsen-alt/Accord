# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-08

### Added

#### Visibility & Observability

- **Simulation Engine**: New `POST /api/v1/simulate` endpoint for dry-running policies without side effects.
- **Policy Graph API**: New `GET /api/v1/policies/graph` endpoint returning nodes/edges for visualization.
- **Webhook Audit**: Added `WebhookAuditLogger` support for pushing events to external observability stacks (Splunk, Datadog, ELK).

#### Control & Safety

- **Policy Versioning**: Policies are now immutable artifacts. Saving creates a new version.
- **Rollback Capability**: CLI command `accord policy rollback <id>` to instantly revert to previous versions.
- **Impact Analysis**: `POST /api/v1/policies/impact` to preview how a new policy affects existing identities.

#### Developer Experience

- **Risk Signals**: Documentation and examples for injecting external risk data via `beforeDecision` hooks.
- **Static Initialization**: Added `Accord.create()` factory method to ensure safe async initialization.

### Changed

- **Breaking Change (Postgres Only)**: Database schema updated to support policy versioning. Run `migrate_v13.sql` on upgrade.
- `PostgresStoreAdapter.savePolicy` now inserts new versions instead of updating existing rows.
- `FileStoreAdapter` implements new `IStorageAdapter` methods (returns current state for history methods).
- **Breaking Change**: `new Accord()` constructor is now private in favor of `await Accord.create()` for safety.

### Fixed

- Resolved interface compliance issues in `FileStoreAdapter` regarding versioning methods.
- Fixed type imports in `AccordV2Config`.
- Fixed race condition in `reload()` tests by ensuring initialization completes before checks.

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

## [1.1.0] - 2026-01-25

### Added

- **Enterprise Observability**: Introduced `AuditLogger` interface, `ConsoleAuditLogger`, and `FileAuditLogger`.
- **YAML Configuration Support**: Native parsing for `.yaml` and `.yml` policy files.
- **Hot Reload Capability**: Added `Accord.reload()` public method.
- **Enhanced CLI**: `validate` and `eval` commands.
- **Reliability & Safety**: Zod Schema Validation.
- **Framework Adapters**: Implemented `AccordGuard` (NestJS), `accordHook` (Fastify), and refined Express Middleware.

## [1.0.0] - Initial Release

### Added

- **Core Engine**: Policy evaluation and identity resolution.
- **Identity Runtime**: System of Record for internal identities.
- **Configuration**: JSON-based policy and identity definitions.
- **Evaluation Model**: RBAC, ABAC, Explicit Deny-by-default.
- **Adapters**: Basic Express Middleware.
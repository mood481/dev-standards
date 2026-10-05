# PocketBase guide

## Purpose

Keep PocketBase hooks, migrations, schema, configuration and operational behavior deterministic and independent from a particular deployment mechanism.

## Architecture and hooks

- Backend code MUST NOT depend on presentation implementation details.
- Public HTTP/API behavior and persisted schema are contracts and MUST be changed deliberately.
- Hooks SHOULD be organized by domain or responsibility rather than accumulated in generic helper files.
- Event-specific orchestration SHOULD remain distinct from substantial domain logic when the latter can be tested independently.
- Hook execution order MUST NOT depend on accidental filesystem ordering unless guaranteed and documented.
- Side effects SHOULD be visible and narrowly scoped.
- Iteration over dates, recurrences, records or cursor-like state MUST have demonstrable progress and termination conditions.

## Schema and migrations

- Persisted schema changes MUST be represented by versioned migrations.
- Administrative UI changes MUST be captured in migrations before becoming application baseline.
- Already-applied migrations MUST NOT be rewritten to change production history; create a new migration.
- Migration ordering MUST be deterministic.
- Migration identifiers MUST avoid collisions across migration sources assembled into one runtime.
- Destructive migrations MUST make data-loss implications explicit in review.
- Data and schema transformation SHOULD be separated when that improves rollback or validation.

## Configuration and persistence

- Environment-dependent configuration MUST NOT be hardcoded.
- Secrets and production data MUST NOT be committed.
- Seed/bootstrap data MUST be distinguishable from live data and SHOULD be idempotent where repeated execution is possible.
- Application architecture MUST remain independent from process supervisor or container runtime.
- Deployment automation owns stop/start/replacement/supervision of the process.
- Persistent data directories are state external to the application artifact.
- SQLite files MUST NOT be copied or manipulated as ordinary files while PocketBase may be writing to them.
- Backup and restore MUST preserve SQLite consistency.

## Compatibility and validation

- Collection, field, route, authentication and response-shape changes MUST consider existing clients.
- Breaking contract changes MUST be explicit in review.
- Additive evolution SHOULD be preferred when it reasonably avoids coordinated releases.
- Schema/migration changes SHOULD be validated from a clean database state when practical.
- Validation MUST include failure behavior where correctness depends on ordering, termination or data shape.

# Development rules

## Purpose

Keep changes cohesive, reviewable, reversible and limited to the minimum surface required by the requested outcome.

## Rules

- A change MUST have one primary intent.
- A change MUST modify only the code, configuration, tests and documentation required to implement or validate that intent.
- Existing architecture and nearby conventions MUST be inspected before introducing a new pattern.
- Existing patterns SHOULD be extended when they fit the requirement; parallel abstractions MUST NOT be introduced without a concrete reason.
- Refactoring SHOULD be driven by the requested change or handled as an independently scoped change.
- Unrelated cleanup, renaming, reformatting, dependency upgrades and opportunistic fixes MUST NOT be bundled into a functional change.
- New abstractions MUST solve a current demonstrated need. Hypothetical future reuse alone is insufficient.
- Public contracts and dependency boundaries SHOULD remain as small as practical.
- Contributors and agents MUST NOT expand scope merely because adjacent work is visible or aesthetically desirable.
- If an out-of-scope issue blocks the requested work, the required expansion MUST be identified explicitly before continuing.
- Public API, schema, migration, authorization, configuration, compatibility and deployment effects MUST be considered when relevant.
- Destructive data, migration or environment operations MUST NOT be performed unless the requested work explicitly requires them.
- Secrets, credentials, production data and sensitive environment values MUST NOT be committed.
- Repository tooling and CI are authoritative for rules they mechanically enforce.

## Completion

A change is complete only when the requested outcome is implemented, applicable validation has passed, material contract or operational effects are identified, unrelated work is excluded, and any validation that could not be run is reported explicitly.

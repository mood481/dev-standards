# TypeScript and JavaScript guide

## Purpose

Keep TypeScript and JavaScript explicit, cohesive, predictable and easy to review across applications, libraries and backend contexts.

## Language and files

- Source comments MUST be written in English.
- Names SHOULD be descriptive and domain-oriented.
- Comments SHOULD explain intent, invariants, trade-offs or non-obvious constraints rather than restating code.
- Dead code and commented-out implementations MUST NOT be committed.
- Keep public APIs minimal and intentional.
- Cross-package imports MUST use the owning package's public API rather than implementation internals.
- Prefer composition over inheritance; use inheritance only for stable substitutable specialization.
- Prefer functions for pure transformations and simple stateless logic.
- Use classes when state, injected dependencies, lifecycle or encapsulated invariants make them the clearer boundary.
- Keep one primary responsibility per file. Large files SHOULD trigger a cohesion review before becoming catch-all units.
- Generic dumping grounds such as unrelated `utils`, `common`, `helpers` or catch-all `types` files MUST NOT be introduced.

## Control flow

- Use braces for every control-statement body.
- Functions and methods SHOULD have one cohesive responsibility.
- Prefer one normal-success return when it keeps the normal path clear.
- Early returns are appropriate for invalid input, unmet preconditions, errors or exceptional guards.
- Do not introduce artificial mutable result variables or inverted predicates solely to manufacture a single return.
- Deep branching, mixed parsing/validation/orchestration and duplicated setup SHOULD trigger decomposition.

## Dependencies and types

- Use `import type` for type-only imports.
- Remove unused imports and values.
- Every imported workspace/package dependency MUST be declared explicitly by the consumer.
- Dependency upgrades MUST NOT be bundled into unrelated work.
- Preserve strict TypeScript compiler and lint posture.
- `any` and `as any` MUST NOT be used in production code.
- Treat unknown/untrusted input as `unknown` and validate or narrow it.
- Assertions MUST NOT silence a type error without establishing the corresponding invariant.
- Use `as const` for literal catalogs and `satisfies` when it validates without discarding useful inference.
- Shared contract types MUST have one clear owner.

## Async and reactive work

- Use `Promise` for one finite asynchronous result when no established reactive contract applies.
- Prefer an Observable for streams, subscriptions or long-lived reactive sources when the surrounding framework/API uses that abstraction.
- Existing Observable contracts MUST NOT be converted to Promises merely for syntactic convenience.
- Every promise MUST be awaited, returned or deliberately handled.
- Observable subscriptions MUST have a clear owner and lifecycle.
- Fire-and-forget work MUST be explicit and define error handling.

## Errors and tests

- Errors SHOULD include useful operation context without leaking secrets.
- Errors MUST NOT be silently swallowed.
- Catch blocks MUST handle, translate, enrich or deliberately propagate.
- Tests SHOULD verify observable behavior and contracts rather than private implementation details.
- Regression fixes SHOULD include a test when the behavior can be reproduced reliably.
- Test helpers MUST NOT force production APIs to expand solely for test convenience.

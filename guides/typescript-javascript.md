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
- A TypeScript source file SHOULD define at most one primary exported class, interface or type.
- Exported classes and interfaces SHOULD normally live in dedicated files.
- Small private or local supporting types MAY remain colocated when they exist only to describe the implementation of the file's primary abstraction and have no independent reuse or domain meaning.
- JavaScript modules SHOULD follow the same single-primary-abstraction principle when they expose a non-trivial stateful, service, adapter or orchestration boundary.
- Generic dumping grounds such as unrelated `utils`, `common`, `helpers` or catch-all `types` files MUST NOT be introduced.

## Modules and structural complexity

- A module MUST have one cohesive architectural responsibility; proximity in the same file MUST NOT become the reason unrelated behavior stays together.
- A module MUST NOT become an architectural boundary merely because related functions were progressively added to the same file.
- Functions and methods SHOULD represent one cohesive operation or phase.
- A function that substantially mixes validation, transformation, orchestration and side effects MUST be decomposed into explicit responsibilities.
- Multiple independent branches, phases, mutable context, broad parameter lists or unrelated error paths SHOULD trigger a design review rather than continued local expansion.
- A module that accumulates many private functions operating on the same state, context or dependency set SHOULD trigger extraction of an explicit abstraction instead of further helper growth.
- Repeatedly adding private helpers to keep a growing module superficially manageable MUST NOT substitute for reviewing its ownership and boundaries.
- File or function length alone MUST NOT determine decomposition; cohesion, responsibilities, dependencies, state and control-flow complexity are the deciding factors.

## Classes and composition

- In TypeScript, non-trivial domain, service, adapter, orchestration and stateful boundaries SHOULD normally be modeled as classes rather than collections of loosely related exported functions.
- JavaScript SHOULD adopt the same class-based boundary when state, dependencies, lifecycle, invariants or a family of related operations make a procedural module an implicit object.
- Prefer free functions for pure transformations, predicates, small factories and simple stateless operations.
- Classes SHOULD encapsulate their invariants and own the state and dependencies required by their behavior.
- Dependencies SHOULD be supplied explicitly, preferably through construction or composition, rather than acquired implicitly from global or module state.
- Composition SHOULD be the primary mechanism for combining behavior and capabilities.
- Inheritance SHOULD be used only for stable, substitutable specialization where the subtype genuinely satisfies the base contract; it MUST NOT be introduced merely to reuse implementation.
- Stateful or behavioral collaboration SHOULD prefer composed collaborators over deep inheritance hierarchies.

## Control flow

- Use braces for every control-statement body.
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

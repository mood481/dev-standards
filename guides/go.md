# Go guide

## Purpose

Define reusable Go source design and review conventions.

Follow Effective Go, Go Code Review Comments and the Google Go Style Guide when they do not conflict with this guide or the consuming repository's architecture.

## Design and packages

- Organize files by responsibility, not one type per file.
- Keep related implementation in the same package unless a distinct public abstraction or dependency boundary justifies another package.
- Do not create generic packages named `util`, `common` or `helpers`.
- Keep exported APIs minimal. Do not export identifiers only to facilitate tests.
- Keep names idiomatic and document exported identifiers when their purpose is not evident from their name and type.
- Separate decoding, normalization, validation, encoding, I/O, policy and command handling when independently substantial.
- Review cohesion whenever a file accumulates multiple independently changing responsibilities.
- Files above 600 lines require a cohesion review; this is a review trigger, not a target or an automatic reason to introduce a new package. Generated files are exempt.
- Prefer splitting cohesive responsibilities inside an existing package before introducing a package solely to reduce file size.
- Use standard Go formatting and import grouping.

## Structs, functions and interfaces

- Use structs with methods when state, injected dependencies or lifecycle are involved.
- Prefer functions for pure transformations and simple logic.
- Define small interfaces at the consuming boundary, accept interfaces and return concrete types.
- Do not create speculative interfaces or one-implementation interfaces unless they isolate a real dependency boundary.
- Add constructors only when they establish invariants, dependencies or resources.
- Use option structs or functional options only when they remove real configuration ambiguity.
- Prefer useful zero values; use pointers for distinguishable absence, shared mutation or genuinely optional data.

## Application boundaries and context

- Keep transport parsing and rendering at the transport boundary.
- Move substantial coordination behind an application boundary that can be invoked without transport-specific arguments or output streams.
- Application operations SHOULD accept application inputs and return data plus errors or diagnostics rather than render transport output.
- Keep persistence details behind their owning package boundary.
- Do not introduce speculative application interfaces; extract a boundary when an implemented operation or second transport needs it.
- Accept `context.Context` first for remote or potentially blocking work.
- Context MUST NOT be stored in structs or be nil.
- Derive a child context only at the boundary that owns the narrower lifetime.
- Use cancellation, timeout or deadline semantics deliberately for the lifetime being owned.
- Call every returned cancel function and propagate the child context to downstream work.

## Errors, resources and output

- Return errors and wrap added context with `%w`; inspect wrapped errors with `errors.Is` and `errors.As`.
- Typed errors SHOULD exist only when callers can recover or choose behavior.
- Reserve panic for unrecoverable invariants or tests.
- Acquire and release resources in a visible scope and handle meaningful close errors.
- Programs that own operator-facing output SHOULD centralize writes behind a small output abstraction rather than scatter unchecked writes through parsing and business logic.
- Operator-facing output SHOULD handle or record write errors and keep text or structured rendering separate from parsing, validation and domain logic.

## Concurrency and channels

- Every goroutine MUST have an owner, cancellation path and termination condition.
- Use channels for asynchronous streams or coordination, not as substitutes for synchronous collections.
- The creator owns channel closure unless ownership is explicitly transferred.
- Propagate context cancellation through goroutines and downstream blocking work.

## Tests

- Test behavior rather than implementation details.
- Test application operations independently from transport parsing and rendering once such a boundary exists.
- Use table-driven tests where cases benefit from shared structure.
- Define small fakes at the consumer boundary rather than expanding production APIs for tests.
- Keep exceptions narrow and explain their invariant or trade-off close to the code.

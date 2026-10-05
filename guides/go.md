# Go guide

## Purpose

Define reusable Go source design and review conventions.

Follow Effective Go, Go Code Review Comments and the Google Go Style Guide when they do not conflict with this guide or the consuming repository's architecture.

## Design and packages

- Organize files by responsibility, not one type per file.
- Keep related implementation in the same package unless a distinct public abstraction or dependency boundary justifies another package.
- Do not create generic packages named `util`, `common` or `helpers`.
- Keep exported APIs minimal. Do not export identifiers only to facilitate tests.
- Separate decoding, normalization, validation, encoding, I/O, policy and command handling when independently substantial.
- Large files SHOULD trigger a cohesion review; generated files are exempt.
- Prefer splitting cohesive responsibilities inside an existing package before introducing a package solely to reduce file size.
- Use standard Go formatting and import grouping.

## Structs, functions and interfaces

- Use structs with methods when state, injected dependencies or lifecycle are involved.
- Prefer functions for pure transformations and simple logic.
- Define small interfaces at the consuming boundary, accept interfaces and return concrete types.
- Do not create speculative interfaces or one-implementation interfaces unless they isolate a real dependency boundary.
- Add constructors only when they establish invariants, dependencies or resources.
- Prefer useful zero values; use pointers for distinguishable absence, shared mutation or genuinely optional data.

## Application boundaries and context

- Keep transport parsing/rendering at the transport boundary.
- Move substantial coordination behind an application boundary that can be invoked without transport-specific arguments or output streams.
- Application operations SHOULD accept application inputs and return data plus errors/diagnostics.
- Keep persistence details behind their owning package boundary.
- Accept `context.Context` first for remote or potentially blocking work.
- Context MUST NOT be stored in structs or be nil.
- Derive child contexts only at boundaries that own the narrower lifetime and call returned cancel functions.

## Errors, resources and concurrency

- Return errors and wrap added context with `%w`; inspect wrapped errors with `errors.Is`/`errors.As`.
- Typed errors SHOULD exist only when callers can recover or choose behavior.
- Reserve panic for unrecoverable invariants or tests.
- Acquire and release resources in a visible scope and handle meaningful close errors.
- Every goroutine MUST have an owner, cancellation path and termination condition.
- The creator owns channel closure unless ownership is explicitly transferred.

## Tests

- Test behavior rather than implementation details.
- Use table-driven tests where cases benefit from shared structure.
- Define small fakes at the consumer boundary rather than expanding production APIs for tests.
- Keep exceptions narrow and explain their invariant or trade-off close to the code.

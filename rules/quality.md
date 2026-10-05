# Quality rules

## Purpose

Define reproducible completion expectations while leaving executable commands and thresholds to each repository.

## Rules

- A repository-defined consolidated quality or validation path MUST be used when one exists.
- When no consolidated path exists, contributors MUST run the relevant lint, typecheck, test and build/package targets for the affected code.
- Repository compiler, lint and maintainability thresholds MUST NOT be weakened merely to make a change pass.
- Relevant automated tests MUST pass for changed behavior when that behavior can be validated reliably.
- Build or package validation MUST run when a change can affect compilation, packaging, public APIs or runtime assembly.
- Runtime smoke tests and end-to-end tests MAY complement static and unit validation but MUST NOT silently replace required compiler, lint or unit checks.
- Focused project/package validation MAY be used during bounded work when it provides equivalent confidence; repository policy or CI MAY still require broader validation before merge.
- Failing validation MUST NOT be suppressed, omitted or misrepresented.
- Broad lint disables, compiler relaxations, exclusion patterns or blanket suppressions MUST NOT be used to pass a gate.
- Necessary exceptions MUST be narrow and their rationale SHOULD be visible near the exception or in repository tooling.
- Validation that cannot be executed MUST be reported explicitly with the reason.

## Verification

Prefer one repository-owned command that reproduces the normal CI validation path. The exact command belongs to the consuming repository's operations documentation and executable tooling.

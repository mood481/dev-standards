# Commit rules

## Purpose

Keep commit history concise, consistent, machine-readable and useful for review, debugging, release analysis and automation.

## Rules

- Commit messages MUST follow Conventional Commits.
- The preferred form is `type(scope): concise summary` when a useful scope exists.
- Common types include `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore` and `perf`.
- Breaking changes MUST use Conventional Commits breaking-change notation.
- The subject MUST concisely describe the outcome and SHOULD use imperative, action-oriented wording.
- Commit bodies SHOULD be omitted unless they add rationale, constraints, compatibility effects or other information not apparent from the diff.
- A commit SHOULD represent one coherent step.
- Unrelated formatting, cleanup, dependency upgrades or fixes MUST NOT be mixed into a functional commit.
- Repository-specific traceability trailers MAY be required by a consuming repository or workflow; when present they MUST reflect the work that actually produced the commit.
- AI provenance metadata is repository policy, not a universal requirement of this standard.

## Verification

The commit message conforms to Conventional Commits, its subject is concise, and any body or trailers add accurate information rather than noise.

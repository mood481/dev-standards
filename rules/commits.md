# Commit rules

## Purpose

Keep commit history concise, consistent, machine-readable and useful for review, debugging, release analysis and automation.

## Rules

- Commit messages MUST follow Conventional Commits.
- The preferred form is `type(scope): concise summary` when a useful scope exists.
- Common types include `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore` and `perf`.
- Breaking changes MUST use Conventional Commits breaking-change notation.
- The subject MUST concisely describe the outcome and SHOULD use imperative, action-oriented wording.
- The commit body MUST be omitted when it would only repeat the subject or information already evident in the diff.
- When present, the body MUST be limited to non-evident motivation, constraints, decisions, compatibility effects or migration notes.
- The body MUST NOT contain file inventories, low-level change narration, process or agent narration, validation logs, or generated filler text.
- No numeric length limit is imposed; the constraint is semantic.
- A commit SHOULD represent one coherent step.
- Unrelated formatting, cleanup, dependency upgrades or fixes MUST NOT be mixed into a functional commit.
- Agents that materially create a commit SHOULD add a `Model: <agent> - <model> - <variant> - <reasoning-effort>` trailer.
- Trailer values MUST be real and verifiable.
- `<variant>` and `<reasoning-effort>` are optional and can be omitted; invented or `-` or `unknown` values MUST NOT be written.
- When `<agent>` or `<model>` of the trailer data is missing or unavailable, the complete trailer is omitted.
- Trailers are exempt from the restrictions that apply to the explanatory body.

## Verification

The commit message conforms to Conventional Commits, its subject is concise, its body is omitted or limited to non-evident rationale without inventories, narration or filler, and any trailers are accurate and complete.

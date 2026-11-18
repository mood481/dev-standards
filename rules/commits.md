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
- A commit SHOULD represent one cohesive outcome rather than an implementation checkpoint or an isolated file edit.
- One cohesive task SHOULD normally reach review as one principal commit; multiple commits MAY remain when they document meaningful, independently reviewable steps or preserve a genuine ordering requirement.
- Unrelated formatting, cleanup, dependency upgrades or fixes MUST NOT be mixed into a functional commit.
- Agents MAY add a `Model: <model>` trailer when the model identity is directly available from authoritative runtime or tool metadata.
- Model trailer values MUST NOT be inferred, guessed or completed from partial information.
- The `Model:` trailer is informational and MUST NOT be treated as authoritative execution provenance.
- Repositories with an authoritative execution or provenance system SHOULD rely on that system rather than duplicating or approximating richer provenance in commit messages.
- Trailers are exempt from the restrictions that apply to the explanatory body.

## Local consolidation before publication

- Intermediate commits MAY be used during implementation for safe local checkpoints; they SHOULD NOT become permanent history merely because iterative fixes, tests or formatting were committed separately.
- Before the first push and before opening a task PR, the contributor or agent SHOULD inspect the task's commit range and consolidate with squash or fixup when several local commits only refine the same cohesive outcome.
- Consolidation MUST be limited to commits confirmed to belong entirely to that task and to be unpublished, unshared and not under review. Check the branch base, upstream refs, commit authorship/ownership and working-tree state before choosing a history-rewriting operation.
- If those conditions cannot be established, the agent MUST preserve the existing history and obtain an explicit decision rather than guessing or rewriting it.
- Consolidation MUST preserve the final file tree, functionality, required sequencing and material authorship, attribution, sign-offs, breaking-change notices and other required trailers. The resulting commit message SHOULD describe the overall outcome rather than enumerate file-by-file iterations.
- After consolidation, the contributor MUST compare the resulting changes with the pre-consolidation result and rerun applicable validation. Rewriting history MUST NOT conceal removed functionality or silently change the task scope.
- Already pushed, shared, reviewed or merged commits MUST NOT be automatically squashed, rebased, reset or force-pushed. Rewriting any such history requires explicit authorization and a coordination plan for affected collaborators.
- Squashing local, exclusively owned commits before publication is distinct from the PR merge strategy; automation MUST NOT infer permission to squash or rewrite commits when merging a PR.

## Verification

The commit message conforms to Conventional Commits, its subject is concise, its body is omitted or limited to non-evident rationale without inventories, narration or filler, and any informational trailers contain only directly available data. Where local consolidation was appropriate, the reviewed changes and validation still match the intended task outcome.

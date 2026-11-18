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

## Task branches and work isolation

- Before making changes, contributors and agents MUST identify the active branch, inspect the working tree (including untracked files when working locally), compare relevant local and remote refs, and check whether an existing task branch or pull request already covers the work.
- Ordinary implementation work MUST use a dedicated branch for one concrete, well-defined task. It MUST NOT be implemented directly on `devel` or `main`.
- A new task branch MUST start from the current `devel`, except for an explicitly justified, dependent feature stage defined in the pull request rules.
- New functionality, improvements, documentation, refactoring, tooling and maintenance tasks MUST use `feature/<task>`. The branch MUST contain one cohesive outcome, not an accumulation of adjacent or successive tasks.
- Corrections to defects already present in `devel` MUST use `bugfix/<defect>`, branch from `devel`, and remain independent of unmerged branches. Bugfix branches MUST NOT be stacked or depend on other pending bugfixes.
- A defect found in an unmerged feature that belongs to that feature's scope MUST be corrected in its existing feature branch; review iterations MUST NOT generate new task branches merely to record adjustments.
- Branch suffixes MUST be concise, descriptive kebab-case; a task identifier MAY be included. Conventional Commit types do not define or replace branch prefixes.
- The existing task branch MUST be reused for work within its scope when it remains open. A new unrelated finding MUST become a separate task and branch rather than expanding the current change opportunistically.
- Local or untracked files MUST NOT be treated as disposable, attached to another task or moved into a new branch without verifying ownership.
- Contributors MUST NOT silently stash, reset, clean, cherry-pick unrelated work, force-rebase or rewrite shared history to isolate a task. If an unsafe local state prevents isolation, request a decision or use a separate worktree.
- Repositories that lack the standard branch structure MUST document the required transition before adopting it. Agents MUST NOT silently rename branches, change default branches, protection or CI, or invent an alternate flow.
- A repository MAY explicitly define additional branch families and integration workflows for distinct purposes. Such decisions MUST be documented and MUST NOT silently replace the ordinary `feature/*` and `bugfix/*` task rules.
- Promotion from `devel` to `main` is a separate integration/release operation, governed by its authorized integrator and repository release process; it is not an ordinary feature or bugfix task. Agents MUST NOT perform promotions or releases merely because a task branch or PR exists.

## Completion

A change is complete only when the requested outcome is implemented, applicable validation has passed, material contract or operational effects are identified, unrelated work is excluded, and any validation that could not be run is reported explicitly.

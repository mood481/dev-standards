# Pull request rules

## Purpose

Make pull requests meaningful integration units with correct dependency relationships, reviewable scope and explicit validation.

## Integration purpose

- A task pull request MUST represent one concrete, well-defined task and originate from its dedicated `feature/*` or `bugfix/*` branch.
- A pull request MUST NOT be opened merely because a branch exists; open it when there is a coherent change ready for review or useful early feedback.
- Independent tasks MUST use separate pull requests, even when they belong to the same initiative. Review corrections within the same task MUST remain on its existing branch and PR.
- One task MUST NOT be arbitrarily split into successive, near-identical PRs merely to record file-by-file edits, intermediate checkpoints or review iterations.
- A broad initiative MAY be divided into multiple feature tasks and PRs at meaningful, independently reviewable integration boundaries. Genuine dependencies MUST follow the explicit stacked-feature process below.
- Multiple pull requests MUST NOT represent the same effective change unless they are deliberate, non-overlapping dependency stages.

## Base and dependencies

- An ordinary `feature/*` branch MUST start from `devel` and its PR MUST target `devel`, unless it is a justified dependent feature stage.
- A dependent feature stage MAY branch from an unmerged feature only when a broader initiative merits separately reviewable stages and its implementation truly requires the earlier stage.
- While the dependency remains unmerged, the dependent feature PR MUST target the immediate dependency branch rather than `devel`; its description MUST identify the prerequisite PR and integration order.
- After the prerequisite merges, the dependent PR MUST be retargeted to `devel` and its entire diff and remaining commits MUST be rechecked for accidental inclusion or duplication. Any necessary history adjustment MUST preserve shared work and follow the commit-rewriting safeguards.
- Independent sibling feature tasks MAY open separate PRs to `devel` in parallel. Features that depend on pending work MUST NOT be presented as independent, consecutive PRs directly to `devel`.
- Every `bugfix/*` branch MUST start from `devel`, and its PR MUST target `devel`. Bugfix PRs MUST NOT be stacked, target feature branches or depend on unmerged bugfixes; an unmet prerequisite MUST first be integrated into `devel`.
- Defects that are part of an unmerged feature MUST be resolved on that feature branch instead of opening a dependent bugfix PR.
- Stacked feature PRs MUST expose a clear dependency order and MUST NOT create competing integration paths for the same commits.
- Before opening a PR, contributors MUST check for an existing PR with the same task intent and review the full base-to-head diff, not only the latest commit. The branch, commits, changed files and PR description MUST match the stated scope.
- Other explicitly documented repository integration workflows and the authorized promotion of `devel` to `main` are distinct from these ordinary task PR rules; they MUST NOT be inferred as exceptions for regular feature or bugfix work.

## Description

A pull request MUST contain at least:

### Purpose + Scope

State the behavior, defect or engineering need and the affected scope. For multi-area work, explain why the areas must change together.

### Changes

Summarize the material changes without reproducing the diff file by file.

Additional sections SHOULD be added only when useful, including validation, contract/schema impact, deployment/operational impact or UI evidence.

## Reviewability and readiness

- Pull requests SHOULD be small enough to understand and validate without reconstructing unrelated history.
- Generated files, formatting churn and lockfile changes SHOULD be limited to what the change requires.
- Refactors that materially obscure a behavioral change SHOULD be split unless they are a prerequisite.
- Breaking changes MUST be called out prominently.
- Out-of-scope review findings SHOULD normally become follow-up work.
- A pull request is ready to merge only when its base is correct, dependencies are represented accurately, scope matches the changed code, mandatory validation passes and correctness/scope review feedback is resolved.

## Merge strategy

- The preferred integration is a merge commit, preserving the reviewed commits plus the integration decision as an additional commit.
- Rebase-and-merge is permitted when a deliberately linear history is wanted and the commits are coherent.
- Squash is not the usual option.
- Automation MUST NOT squash or rewrite the commit structure during the merge.
- A manual squash is only an explicit human decision, never the default behavior.

## Automation

Repositories MAY enforce objective parts of this policy in CI. Automation MUST NOT replace architectural judgment with fragile heuristics. Merge automation MUST expose the strategy it applies so reviewers can confirm it matches the merge strategy above.

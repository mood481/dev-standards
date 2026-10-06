# Pull request rules

## Purpose

Make pull requests meaningful integration units with correct dependency relationships, reviewable scope and explicit validation.

## Integration purpose

- A pull request MUST have one integration purpose.
- A pull request MUST NOT be opened merely because a branch exists.
- Independent changes MUST use independent pull requests even when they belong to the same initiative.
- Large changes SHOULD be split at stable integration boundaries rather than arbitrary file counts or implementation chronology.
- Multiple pull requests MUST NOT represent the same effective change unless they are genuine dependency stages.

## Base and dependencies

- The base branch MUST be the branch that logically receives the change next.
- An integration branch MUST NOT be selected automatically when the work depends on another unmerged branch.
- A dependent pull request SHOULD target its dependency while that dependency remains unmerged, then be updated and retargeted after the dependency merges.
- Sibling changes that are truly independent MAY target the same integration branch in parallel.
- Stacked pull requests MUST expose a clear dependency order and MUST NOT create competing paths for the same commits.
- Before opening a pull request, contributors MUST check whether an existing pull request already represents the same integration intent.

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

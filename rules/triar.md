# TRIAR rules

## Purpose

Define repository expectations when TRIAR is adopted as the canonical task workflow and SDD/task-contract system.

## Authority and workspace

- TRIAR task and project state MUST be accessed and mutated through the supported TRIAR CLI and contracts.
- Canonical store files, hidden caches and other TRIAR implementation details MUST NOT be edited directly.
- The repository's TRIAR workspace binding MUST identify the intended project before task work begins.
- Task intent is authored or refined before execution; an executor MUST NOT silently redefine a running task contract.

## Task lifecycle

- Work MUST begin from an explicitly selected task.
- Before implementation, the task's current state and effective context MUST be established through the supported CLI workflow.
- `task start` freezes the task contract; implementation MUST respect that frozen contract.
- Every applicable task Action and its local validation MUST be completed.
- Success Criteria MUST be evaluated against the final workspace state.
- Applicable repository-wide quality gates MUST pass before `task complete`.
- Validation performed only after `task complete` MUST NOT be used to justify the transition to done.
- Failed independent verification returns work to the appropriate rework flow; rework MUST correct verified non-conformities and their strictly derived effects without arbitrarily rewriting the frozen contract.

## Independent verification

- The actor that performs an implementation MUST NOT perform the independent `task check` used to accept that same implementation.
- A verifier MUST evaluate the completed task against its frozen contract and supplied evidence.
- A verifier MUST NOT repair implementation defects while acting as the verifier.
- When indispensable evidence is unavailable, verification SHOULD stop as blocked rather than manufacture a conclusive result.

## Agents

- Canonical TRIAR skills and procedures SHOULD be installed from the TRIAR version in use through `triar agent install`.
- Tool-specific adapters SHOULD remain thin and delegate to the canonical installed TRIAR skills/procedures.
- Repositories MUST NOT maintain divergent copies of canonical TRIAR procedures as local standards.
- Local repository rules and operations MAY specialize execution context, but MUST NOT silently redefine TRIAR lifecycle semantics.

## Repository integration

- Repository quality, architecture, commit and pull-request rules remain applicable to TRIAR-managed work.
- Repository-specific branch models, deployment processes and operational commands belong in local operations documentation rather than this shared rule.

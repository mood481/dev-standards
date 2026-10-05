# Nx and pnpm guide

## Purpose

Define reusable conventions for pnpm workspaces orchestrated with Nx without prescribing repository-specific project names or commands.

## Workspace ownership

- pnpm SHOULD own package/workspace dependency resolution and lockfile state.
- Nx SHOULD own workspace-level task orchestration and the project dependency graph.
- Each project MUST have a clear responsibility and directory owner.
- Cross-project code dependencies MUST use the owning project's public API or declared package boundary.
- Workspace dependencies MUST be declared explicitly rather than relying on accidental transitive resolution.
- Repository-specific project mappings belong in local operations documentation.

## Targets and dependencies

- Common activities SHOULD be expressed as project targets where practical.
- Upstream build requirements SHOULD be encoded in the Nx graph/target configuration rather than remembered manually.
- Root scripts MAY aggregate Nx targets for common validation and build operations.
- Focused work MAY use project-local or affected targets when they provide appropriate confidence.
- Full validation MAY run broader targets before merge or release.
- Non-JavaScript projects MAY participate through command-based Nx targets; an Nx workspace does not imply every project uses Node.js.

## Installation and reproducibility

- A single workspace lockfile SHOULD be used when the repository is designed as one pnpm workspace.
- CI and reproducible validation SHOULD install with the repository's locked dependency state.
- Package-manager and runtime versions SHOULD be pinned or otherwise declared by the repository.
- Generated outputs and dependency installation directories MUST NOT be treated as source boundaries.

## Operations documentation

The consuming repository SHOULD document its actual workspace in local operations docs, including:

- project names and directories;
- concrete dependency directions;
- exact start/build/test/migration commands;
- local ports and services;
- environment-specific behavior;
- full and focused validation commands.

This guide does not own those repository facts.

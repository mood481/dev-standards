---
title: "dev-standards"
description: "Versioned development rules and implementation guides for mood481 repositories."
---

# dev-standards

Versioned development rules and implementation guides shared across mood481 repositories.

The repository separates:

- `rules/`: cross-cutting policy and completion requirements.
- `guides/`: technology-specific implementation guidance.
- `schemas/`: machine-readable adoption contracts.
- `templates/`: small consumer entrypoints such as `AGENTS.md`.

Repository-specific operational documentation stays in the consuming repository.

- Start with [Getting started](getting-started/) for installation with `npx` or `pnpm dlx` and the install/check/update workflow.
- Browse the [CLI reference](cli-reference/) for the complete `list`, `install`, `check` and `update` commands.
- Browse the [Standards](standards/) for the catalog included in the current version, and the [manifest contract](standards/manifest/) behind `docs/manifest.json`.

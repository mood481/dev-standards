---
title: "dev-standards"
description: "Install and maintain versioned development rules and technology guides."
---

# dev-standards

Adopt shared development rules and technology guides in a repository, selecting only the standards that apply to its stack and workflow. The CLI installs versioned Markdown context for contributors and agents, validates it and updates it conservatively.

## Get started

1. [Explore the standards](standards/) to choose the rules and technology guides relevant to your project.
2. Follow [Getting started](getting-started/) to configure the registry and install your selection.
3. Use `check` to detect missing or modified installed standards, and `update` when you want to adopt a newer package version.

For example, after configuring access to the package registry:

```bash
pnpm dlx @mood481/dev-standards@latest install simple-devel quality commits ts-js
pnpm dlx @mood481/dev-standards@latest check
```

Installed selections are recorded in `docs/manifest.json`; see the [manifest contract](standards/manifest/) to understand what it tracks. An optional `AGENTS.md` helps coding agents find that context, but is not required for using the CLI.

See the [CLI reference](cli-reference/) for supported commands, options and validation behavior.

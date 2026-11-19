---
title: "Standards"
description: "Catalog of rules and guides included in the current version."
weight: 30
---

# Standards

The catalog is the machine-readable source of truth for package-managed context ids. Catalog ids are globally unique because `install` accepts bare ids. This site renders every catalog entry from the same `rules/` and `guides/` sources shipped in the package.

## Rules

- [devel](rules/devel/) — scope, cohesion, boundaries and change discipline.
- [simple-devel](rules/simple-devel/) — development rules without task-branch or PR workflow requirements.
- [quality](rules/quality/) — validation and completion expectations.
- [commits](rules/commits/) — commit history conventions.
- [pull-requests](rules/pull-requests/) — pull request integration and review conventions.
- [triar](rules/triar/) — repository adoption rules for TRIAR task/SDD workflows.

Choose **either** `devel` **or** `simple-devel`, not both. They are mutually exclusive alternatives; consumers make this choice explicitly because the CLI does not enforce it.

## Guides

- [ts-js](guides/ts-js/) — TypeScript and JavaScript.
- [angular](guides/angular/) — Angular.
- [pocketbase](guides/pocketbase/) — PocketBase.
- [go](guides/go/) — Go.
- [nx-pnpm](guides/nx-pnpm/) — Nx with pnpm.
- [lit](guides/lit/) — Lit web components.
- [react-native-expo](guides/react-native-expo/) — React Native, TypeScript and Expo.

The `adr`, `runbook` and `reference` catalog maps are currently empty and ready for shared documents when needed. See the [manifest contract](manifest/) for how package-managed and consumer-owned entries combine in `docs/manifest.json`.

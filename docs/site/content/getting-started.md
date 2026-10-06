---
title: "Getting started"
description: "Install dev-standards with npx or pnpm dlx and adopt the shared rules."
weight: 10
---

# Getting started

## Requirements

Node.js 22 or newer. The package uses only Node.js built-ins.

## Registry setup

The package is published to the organization's Gitea npm registry as `@mood481/dev-standards`. Configure the `@mood481` scope without replacing the public npm registry used by normal dependencies.

Repository-local configuration (`.npmrc`):

```ini
@mood481:registry=https://git.mood481.es/api/packages/mood/npm/
//git.mood481.es/api/packages/mood/npm/:_authToken=${GITEA_TOKEN}
```

Export a Gitea token with package read access before using `pnpm dlx` or `npx`:

```bash
export GITEA_TOKEN='<token>'
```

Do not commit the token.

## List the catalog

```bash
pnpm dlx @mood481/dev-standards@next list
```

or with `npx`:

```bash
npx -p @mood481/dev-standards@next dev-standards list
```

## Install selected standards

```bash
pnpm dlx @mood481/dev-standards@0.2.0 install \
  devel \
  quality \
  commits \
  pull-requests \
  ts-js \
  pocketbase \
  nx-pnpm
```

Equivalent with `npx`:

```bash
npx -p @mood481/dev-standards@0.2.0 dev-standards install \
  devel quality commits pull-requests ts-js pocketbase nx-pnpm
```

Use `--path <repository>` to target another checkout. Use an exact version for reproducible installation; the consumer manifest always stores the exact package version actually used.

The installer creates or updates:

```text
AGENTS.md
docs/
├── manifest.json
├── rules/
│   └── ...
├── guides/
│   └── ...
├── operations/
│   └── ...             # consumer-owned; only indexed by the manifest
├── adrs/
│   └── ...             # package-managed or consumer-owned
├── runbooks/
│   └── ...             # package-managed or consumer-owned
└── references/
    └── ...             # package-managed or consumer-owned
```

An existing `AGENTS.md` is preserved. Standards-owned files are never overwritten by `install` when they differ locally. Adding standards from a newer package version requires `update` first so the manifest always describes one coherent source version.

## Check

```bash
pnpm dlx @mood481/dev-standards@0.2.0 check
```

`check` fails when a package-managed document is missing or modified, when the manifest context does not match the selection, or when consumer-owned documents change without refreshing the manifest. A missing `AGENTS.md` is reported as a warning.

## Update

Run the **target package version** and ask it to update the installed selection:

```bash
pnpm dlx @mood481/dev-standards@next update
```

The updater refuses downgrades, refuses to overwrite any standard whose local content no longer matches its installed hash, replaces unchanged installed standards with the target package contents, and refreshes managed and consumer-owned context entries together with the exact source version.

## Version channels

- `devel` — development prereleases.
- `next` — alpha, beta and release-candidate builds.
- `latest` — stable releases.

Use a channel for interactive testing, but prefer an exact version for reproducible installation in a repository.

---
title: "CLI reference"
description: "Complete list, install, check and update commands."
weight: 20
---

# CLI reference

```text
dev-standards list
dev-standards install <id> [<id> ...] [--path <repository>] [--agents]
dev-standards check [--path <repository>]
dev-standards update [--path <repository>]
dev-standards --version
```

## `list`

Print the installable catalog as `<type>\t<id>` rows:

```bash
pnpm dlx @mood481/dev-standards@latest list
```

## `install`

Install selected standards for the current package version:

```bash
pnpm dlx @mood481/dev-standards@latest install devel quality --path /tmp/example
```

- Requires at least one standard id; unknown ids fail.
- Unknown options fail; the only options are `--path <repository>` (defaults to the current directory) and `--agents`.
- `install` without `--agents` never creates `AGENTS.md`.
- With `--agents`, `install` creates `AGENTS.md` from the packaged template only when it does not already exist; an existing `AGENTS.md` is always preserved and never overwritten.
- Refuses to mix versions: when `docs/manifest.json` already records another version, install fails and asks for `update` with the new package version first.
- Refuses to overwrite a divergent file: an existing destination whose content differs from the package content fails instead of being replaced.
- Writes `docs/manifest.json` and indexes consumer-owned context found in `docs/operations`, `docs/adrs`, `docs/runbooks` and `docs/references`. `AGENTS.md` stays outside `docs/manifest.json` and integrity tracking.

## `check`

Validate the installed manifest, selected files and locally indexed context:

```bash
pnpm dlx @mood481/dev-standards@latest check --path /tmp/example
```

- Accepts no standard ids; it operates on `docs/manifest.json`.
- Fails on a missing or modified package-managed document, on manifest context that does not match the selection, and on consumer-owned context that drifted from its `docs/` directories.
- Absence of `AGENTS.md` is normal: no warning and no failure solely because the file is missing.
- On success prints `ok\t<version>\t<N rules>\t<M guides>`.

## `update`

Upgrade every installed standard to the running package version when the installed files still match their recorded hashes:

```bash
pnpm dlx @mood481/dev-standards@next update --path /tmp/example
```

- Accepts no standard ids; the selection comes from the manifest.
- Refuses downgrades and missing installed standards.
- Refuses to overwrite locally modified files; divergence surfaces as a conflict.
- Rewrites `docs/manifest.json` with the new exact source version and refreshes managed plus consumer-owned entries.
- Never creates `AGENTS.md` implicitly and preserves any existing `AGENTS.md`.
- Prints `updated\t<from>\t->\t<to>`, or `current\t<version>` when already up to date.

## Global options

- `--path <repository>` — target checkout (all commands except `list`).
- `--version`, `-v` — print the package version.
- `--help`, `-h` — print the short usage text.

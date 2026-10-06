---
title: "CLI reference"
description: "Complete list, install, check and update commands."
weight: 20
---

# CLI reference

```text
dev-standards list
dev-standards install <id> [<id> ...] [--path <repository>]
dev-standards check [--path <repository>]
dev-standards update [--path <repository>]
dev-standards --version
```

## `list`

Print the installable catalog as `<type>\t<id>` rows:

```bash
pnpm dlx @mood481/dev-standards@0.2.0 list
```

## `install`

Install selected standards for the current package version:

```bash
pnpm dlx @mood481/dev-standards@0.2.0 install devel quality --path /tmp/example
```

- Requires at least one standard id; unknown ids fail.
- Unknown options fail; the only option is `--path <repository>` (defaults to the current directory).
- Refuses to mix versions: when `docs/manifest.json` already records another version, install fails and asks for `update` with the new package version first.
- Refuses to overwrite a divergent file: an existing destination whose content differs from the package content fails instead of being replaced.
- Writes `docs/manifest.json`, indexes consumer-owned context found in `docs/operations`, `docs/adrs`, `docs/runbooks` and `docs/references`, and creates `AGENTS.md` from the packaged template only when it does not exist.

## `check`

Validate the installed manifest, selected files and locally indexed context:

```bash
pnpm dlx @mood481/dev-standards@0.2.0 check --path /tmp/example
```

- Accepts no standard ids; it operates on `docs/manifest.json`.
- Fails on a missing or modified package-managed document, on manifest context that does not match the selection, and on consumer-owned context that drifted from its `docs/` directories.
- Prints a missing `AGENTS.md` as a warning, not an error.
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
- Prints `updated\t<from>\t->\t<to>`, or `current\t<version>` when already up to date.

## Global options

- `--path <repository>` — target checkout (all commands except `list`).
- `--version`, `-v` — print the package version.
- `--help`, `-h` — print the short usage text.

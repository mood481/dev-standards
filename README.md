# dev-standards

Versioned development rules and implementation guides shared across mood481 repositories.

The repository separates:

- `rules/`: cross-cutting policy and completion requirements.
- `guides/`: technology-specific implementation guidance.
- `schemas/`: machine-readable adoption contracts.
- `templates/`: small consumer entrypoints such as `AGENTS.md`.

Repository-specific operational documentation stays in the consuming repository. The CLI records existing `docs/operations/*.md` files in the consumer manifest but does not copy or own them.

## Catalog

### Rules

- `development` — scope, cohesion, boundaries and change discipline.
- `quality` — validation and completion expectations.
- `commits` — commit history conventions.
- `pull-requests` — pull request integration and review conventions.
- `triar` — repository adoption rules for TRIAR task/SDD workflows.

### Guides

- `typescript-javascript`
- `angular`
- `pocketbase`
- `go`
- `nx-pnpm`

## Registry setup

The package is published to the organization's Gitea npm registry. Configure the `@mood481` scope without replacing the public npm registry used by normal dependencies.

For repository-local configuration:

```ini
@mood481:registry=https://git.mood481.es/api/packages/mood/npm/
//git.mood481.es/api/packages/mood/npm/:_authToken=${GITEA_TOKEN}
```

Export a Gitea token with package read access before using `pnpm dlx` or `npx`:

```bash
export GITEA_TOKEN='<token>'
```

Do not commit the token.

## Install

List the catalog:

```bash
pnpm dlx @mood481/dev-standards@next list
```

Install selected standards into the current repository:

```bash
pnpm dlx @mood481/dev-standards@0.2.0-alpha.0 install \
  development \
  quality \
  commits \
  pull-requests \
  typescript-javascript \
  pocketbase \
  nx-pnpm
```

Use `--path <repository>` to target another checkout.

The installer creates or updates:

```text
AGENTS.md
docs/
├── manifest.json
├── rules/
│   └── ...
├── guides/
│   └── ...
└── operations/
    └── ...             # consumer-owned; only indexed by the manifest
```

An existing `AGENTS.md` is preserved. Standards-owned files are never overwritten by `install` when they differ locally. Adding standards from a newer package version requires `update` first so the manifest always describes one coherent source version.

For `mplanner-one` in its current backend-only state, the intended initial selection is:

```bash
pnpm dlx @mood481/dev-standards@0.2.0-alpha.0 install \
  development quality commits pull-requests \
  typescript-javascript pocketbase nx-pnpm
```

Add `angular` when the Angular SDK/web libraries are introduced and `triar` only when TRIAR is adopted by the repository.

## Check

Validate the installed manifest, selected files and locally indexed operations:

```bash
pnpm dlx @mood481/dev-standards@0.2.0-alpha.0 check
```

`check` fails when an installed standard is missing or modified, when the manifest does not match the selection, or when the set of `docs/operations/*.md` files changed without refreshing the manifest. A missing `AGENTS.md` is reported as a warning.

## Update

Run the **target package version** and ask it to update the installed selection:

```bash
pnpm dlx @mood481/dev-standards@next update
```

The updater:

1. reads the exact installed version and SHA-256 hashes from `docs/manifest.json`;
2. refuses downgrades;
3. refuses to overwrite any standard whose local content no longer matches its installed hash;
4. replaces unchanged installed standards with the target package contents;
5. refreshes hashes, operations and the exact source version in the manifest.

This makes updates conservative: local divergence is surfaced as a conflict instead of being discarded.

## Version channels

- `devel` — development prereleases.
- `next` — alpha, beta and release-candidate builds.
- `latest` — stable releases.

Use a channel for interactive testing, but prefer an exact version for reproducible installation in a repository. The consumer manifest always stores the exact package version actually used.

## Local validation

Requirements: Node.js 22 or newer. The package uses only Node.js built-ins.

```bash
npm test
npm pack --dry-run

node ./bin/dev-standards.mjs list
node ./bin/dev-standards.mjs install development quality --path /tmp/example
node ./bin/dev-standards.mjs check --path /tmp/example
```

Profiles, agent-specific adapters, OpenSpec guidance and remote synchronization remain outside the current scope.

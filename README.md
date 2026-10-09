# dev-standards

Versioned development rules and implementation guides shared across mood481 repositories.

The repository separates:

- `rules/`: cross-cutting policy and completion requirements.
- `guides/`: technology-specific implementation guidance.
- `schemas/`: machine-readable adoption contracts.
- `templates/`: small consumer entrypoints such as `AGENTS.md`.

Repository-specific operational documentation stays in the consuming repository. The CLI records existing `docs/operations/*.md` files in the consumer manifest but does not copy or own them.

## Manifest

`docs/manifest.json` uses schema version `1` and exposes every document as a context entry:

```json
{
  "schemaVersion": 1,
  "source": {
    "repository": "mood481/dev-standards",
    "version": "0.2.0-alpha.0"
  },
  "context": [
    {
      "type": "rule",
      "id": "devel",
      "path": "docs/rules/development.md",
      "integrity": "sha256:7595d41ab4f88e7dfec9647a0165cc023a6502f05733b0d21fe9914abf9ea254"
    },
    {
      "type": "operation",
      "id": "development",
      "path": "docs/operations/development.md"
    }
  ]
}
```

The registered context types are:

- `rule` — shared policy installed and integrity-checked by this package.
- `guide` — shared technology guidance installed and integrity-checked by this package.
- `operation` — consumer-owned operational documentation indexed by the installer.
- `adr` — architecture decisions or standards under `docs/adrs/`.
- `runbook` — operational procedures under `docs/runbooks/`.
- `reference` — supporting technical reference under `docs/references/`.

These six values are the complete vocabulary for schema version `1`; product requirements, user stories and similar documents remain outside this repository's scope. Rules and guides are always package-managed, while operations are always consumer-owned. ADRs, runbooks and references support both models: an entry with `integrity` is package-managed and listed in `catalog.json`; an entry without it is consumer-owned and discovered by the installer in its conventional directory.

The schema is published as `schemas/manifest.schema.json`, and a complete package example is available as `schemas/manifest.example.json`. A separate example-install command is unnecessary because every normal `install` already writes a real `docs/manifest.json` for the selected standards and local context.

## Catalog

`catalog.json` is the machine-readable source of truth for package-managed context IDs and their package-relative source files. The installer reads it directly instead of inferring IDs from filenames or duplicating them in code. Catalog IDs are globally unique because `install` accepts bare IDs. The `adr`, `runbook` and `reference` maps are currently empty and ready for shared documents when needed.

### Rules

- `devel` — scope, cohesion, boundaries and change discipline.
- `quality` — validation and completion expectations.
- `commits` — commit history conventions.
- `pull-requests` — pull request integration and review conventions.
- `triar` — repository adoption rules for TRIAR task/SDD workflows.

### Guides

- `ts-js`
- `angular`
- `pocketbase`
- `go`
- `nx-pnpm`
- `lit`

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
  devel \
  quality \
  commits \
  pull-requests \
  ts-js \
  pocketbase \
  nx-pnpm
```

Use `--path <repository>` to target another checkout. Use `--agents` to also create `AGENTS.md` from the packaged template when it does not exist.

The installer creates or updates:

```text
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

With `--agents`, the installer also creates `AGENTS.md` from the packaged template only when it does not already exist.

An existing `AGENTS.md` is always preserved and never overwritten. `install` without `--agents` never creates it. Standards-owned files are never overwritten by `install` when they differ locally. Adding standards from a newer package version requires `update` first so the manifest always describes one coherent source version.

For `mplanner-one` in its current backend-only state, the intended initial selection is:

```bash
pnpm dlx @mood481/dev-standards@0.2.0-alpha.0 install \
  devel quality commits pull-requests \
  ts-js pocketbase nx-pnpm
```

Add `angular` when the Angular SDK/web libraries are introduced and `triar` only when TRIAR is adopted by the repository.

## Check

Validate the installed manifest, selected files and locally indexed context:

```bash
pnpm dlx @mood481/dev-standards@0.2.0-alpha.0 check
```

`check` fails when a package-managed document is missing or modified, when the manifest context does not match the selection, or when consumer-owned documents in the four indexed directories change without refreshing the manifest. Absence of `AGENTS.md` is normal: `check` reports no warning and fails for no reason solely because the file is missing. `AGENTS.md` stays outside `docs/manifest.json` and integrity tracking, so the manifest remains fully usable in repositories that intentionally have no `AGENTS.md`.

## Update

Run the **target package version** and ask it to update the installed selection:

```bash
pnpm dlx @mood481/dev-standards@next update
```

The updater:

1. reads the exact installed version and SHA-256 integrity values from `docs/manifest.json`;
2. refuses downgrades;
3. refuses to overwrite any standard whose local content no longer matches its installed hash;
4. replaces unchanged installed standards with the target package contents;
5. refreshes managed and consumer-owned context entries together with the exact source version.

This makes updates conservative: local divergence is surfaced as a conflict instead of being discarded. `update` never creates `AGENTS.md` implicitly and preserves any existing `AGENTS.md`.

## Version channels

- `devel` — development prereleases.
- `next` — alpha, beta and release-candidate builds. Never older than `latest`: a stable release advances it when it lags behind.
- `latest` — stable releases.

Use a channel for interactive testing, but prefer an exact version for reproducible installation in a repository. The consumer manifest always stores the exact package version actually used.

## Local validation

Requirements: Node.js 22 or newer. The package uses only Node.js built-ins.

```bash
npm test
npm pack --dry-run

node ./bin/dev-standards.mjs list
node ./bin/dev-standards.mjs install devel quality --path /tmp/example
node ./bin/dev-standards.mjs check --path /tmp/example
```

### Docs

The docsite sources live in `docs/site/content/` plus the packaged `rules/` and `guides/` rendered through `catalog.json`. Doc coverage runs inside `npm test` (`test/docs.test.mjs`). To inspect the site manually:

```bash
npm run docs:build
npm run docs:verify
npm run docs:serve
```

`docs:serve` rebuilds with the pipeline defaults and serves the same artifact locally at `http://127.0.0.1:8080/dev-standards/`. Prerelease tags (`v0.2.0-beta.2`, …) publish the npm channels on push; stable versions publish (`latest` plus the docsite under `site/dev-standards/`) when their GitHub release is published. The release also advances `next` to the stable version when it lags behind, so `next` is never older than `latest`. package.json holds the release line (e.g. `0.2.0`) and CI stamps it to the tag version before testing and publishing, so prereleases need no package.json bump.

Profiles, agent-specific adapters, OpenSpec guidance and remote synchronization remain outside the current scope.

# dev-standards

Versioned development rules and implementation guides shared across mood481 repositories.

The repository separates:

- `rules/`: cross-cutting policy and completion requirements.
- `guides/`: technology-specific implementation guidance.
- `schemas/`: machine-readable adoption contracts.
- `templates/`: small consumer entrypoints such as `AGENTS.md`.

Repository-specific operational documentation stays in the consuming repository. The installer records existing `docs/operations/*.md` files in the consumer manifest but does not copy or own them.

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

## Local validation

Requirements: Node.js 22 or newer. The package currently uses only Node.js built-ins.

Run the automated smoke test:

```bash
npm test
```

List available standards:

```bash
node ./bin/dev-standards.mjs list
```

Try an installation into a disposable repository:

```bash
mkdir -p /tmp/dev-standards-consumer/docs/operations
printf '# Development\n' > /tmp/dev-standards-consumer/docs/operations/development.md

node ./bin/dev-standards.mjs install \
  development quality commits pull-requests triar \
  typescript-javascript angular pocketbase nx-pnpm \
  --path /tmp/dev-standards-consumer
```

The consumer will receive:

```text
AGENTS.md
docs/
├── manifest.json
├── rules/
│   └── ...
├── guides/
│   └── ...
└── operations/
    └── development.md
```

Existing standard files are never overwritten when their content differs. An existing `AGENTS.md` is preserved. Re-running an identical installation is idempotent.

## Testing the package launcher locally

To test the exact package contents locally, create a package archive:

```bash
npm pack
```

Then test the same package through either launcher:

```bash
pnpm dlx ./mood481-dev-standards-[version].tgz list
npx --yes ./mood481-dev-standards-[√ersion].tgz list
```

Use the same archive with `install ... --path <repo>` to exercise the packaged CLI.

## Manifest v1

A consumer manifest is written to `docs/manifest.json`. It records:

- schema generation;
- source repository and standards version;
- selected rule IDs;
- selected guide IDs;
- existing local operations documents.

Profiles are intentionally outside the v0.1 model.

## Published devel and pre-release

Development builds use the `devel` dist-tag; alpha, beta and release-candidate builds use `next`; stable releases use `latest`.

For an alpha adoption, prefer an exact version when reproducibility matters:

```bash
pnpm dlx @mood481/dev-standards@0.1.1-alpha.1 list
```

The `@next` channel is convenient for interactive testing but consumers record the exact installed version in `docs/manifest.json`.

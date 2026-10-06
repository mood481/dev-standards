---
title: "Manifest contract"
description: "How docs/manifest.json combines managed and consumer-owned context."
weight: 40
---

# Manifest contract

`docs/manifest.json` uses schema version `1` and exposes every document as a context entry:

```json
{
  "schemaVersion": 1,
  "source": {
    "repository": "mood481/dev-standards",
    "version": "0.2.0"
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

These six values are the complete vocabulary for schema version `1`. Rules and guides are always package-managed, while operations are always consumer-owned. ADRs, runbooks and references support both models: an entry with `integrity` is package-managed and listed in `catalog.json`; an entry without it is consumer-owned and discovered by the installer in its conventional directory.

The schema is published as `schemas/manifest.schema.json`, and a complete package example is available as `schemas/manifest.example.json`.

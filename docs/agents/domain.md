# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (this repo):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-orpc-over-trpc.md
│   └── 0002-....md
├── apps/
│   ├── web/
│   └── app/
└── packages/
    ├── db/
    ├── auth/
    ├── billing/
    ├── api/
    └── ui/
```

`packages/*` here are technical/infrastructure layers (schema, auth config, billing adapters, API routers, shared UI) — not separate bounded contexts. They all share the one root glossary. Revisit this (split into a `CONTEXT-MAP.md` + per-package `CONTEXT.md`) only if a package's vocabulary genuinely diverges from the root glossary, not just because it's a separate package.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids — e.g. this repo says **Organization**, not Tenant/Workspace/Account.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

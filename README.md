# Ballast

A scaffold for spinning up SaaS apps quickly: Nuxt, oRPC, Drizzle, better-auth, Turborepo. Clone it, reskin it, ship.

## Stack

- **App**: [Nuxt 4](https://nuxt.com) (single app, public + gated routes — no separate marketing/dashboard split, see `docs/adr/0006-single-app-route-guards.md`)
- **API**: [oRPC](https://orpc.dev) — typed, OpenAPI-compatible RPC over Nitro
- **Database**: [Drizzle](https://orm.drizzle.team) + Postgres
- **Auth & tenancy**: [better-auth](https://better-auth.com), `organization` plugin (a User can belong to several Organizations — see `CONTEXT.md`)
- **Billing**: [Polar](https://polar.sh) by default, Stripe as a swappable alternative (`packages/billing`)
- **Email**: [Lettr](https://lettr.com)
- **UI**: [shadcn-vue](https://www.shadcn-vue.com) (Reka UI + Tailwind v4) — components are copied into the repo, not installed as a dependency
- **Monorepo**: pnpm workspaces + Turborepo
- **Testing**: Vitest, Playwright

Every non-obvious decision here — and why — is recorded in `docs/adr/`. Domain vocabulary (what "Organization" means, etc.) is in `CONTEXT.md`.

## Getting started

```bash
pnpm install

# Start local Postgres
docker compose up -d

# Configure environment
cp .env.example .env
# fill in LETTR_API_KEY, and either POLAR_ACCESS_TOKEN/POLAR_WEBHOOK_SECRET
# or STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET depending on BILLING_PROVIDER

# Create the database schema
pnpm db:migrate

# Run everything
pnpm dev
```

`apps/web` comes up at `http://localhost:3000`.

## Project structure

```
apps/
  web/              the app — public and gated routes in one Nuxt app
packages/
  db/               Drizzle schema + client
  auth/             better-auth config (Drizzle adapter, organization plugin, Lettr email hooks)
  billing/          BillingProvider interface + Polar/Stripe implementations
  api/              oRPC context, procedures, domain services, routers
  config/           shared tsconfig base
```

`packages/api` is organized by domain (`domain/<name>.service.ts` → `router/<name>.router.ts`), not by technical layer — see `docs/adr/0004-light-ddd-not-tactical.md` for how far that goes (and where it deliberately stops).

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the app (Turborepo, all packages) |
| `pnpm build` | Build everything |
| `pnpm typecheck` | Typecheck everything |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm auth:generate` | Regenerate `packages/db/src/schema/auth.ts` after changing better-auth plugins/options |

## Working with Claude Code

This repo ships its own agent configuration — see `CLAUDE.md`. Notably, new pages get designed on a Claude Design canvas and approved before any code is written (`.claude/skills/design-a-page`).

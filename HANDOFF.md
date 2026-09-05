# Ballast — handoff / assumptions log

Working name: **Ballast** (a scaffold repo for spinning up SaaS apps quickly — Nuxt + oRPC + Drizzle + Turborepo). This doc exists so a `/grill-with-docs` pass has something concrete to interrogate — every decision below was made by me, none were confirmed with the user beyond the original stack wishlist (tRPC/Drizzle/Nuxt/Stripe-or-Polar/Turborepo/DDD-maybe).

## What's actually built so far

Only the foundation — got interrupted before the app layer:

```
./package.json                     root scripts, turbo/pnpm workspace root
./pnpm-workspace.yaml
./turbo.json                       build/dev/lint/typecheck pipeline
./.npmrc / .env.example / .gitignore
./packages/config/                 shared tsconfig.base.json
./packages/db/
  drizzle.config.ts
  src/client.ts                    drizzle(postgres-js) singleton
  src/schema/auth.ts                better-auth core + organization tables (hand-written, see caveat below)
```

**Not yet written** (was next): `packages/db/src/schema/billing.ts`, `packages/auth`, `packages/billing`, `packages/api`, `packages/ui`, `apps/web`, `apps/app`. None of this exists on disk yet — the design below is intent, not code.

Not a git repo yet — no `git init` run, nothing committed.

## Decisions made and why

1. **oRPC over tRPC** — tRPC's client is React/React-Query shaped; Vue/Nuxt support (`trpc-nuxt`) is a thin community wrapper. oRPC sits closer to Nitro/h3 (Nuxt's server engine), has a first-class Nuxt adapter, and gets an OpenAPI-compatible contract for free. Verified against oRPC's own docs (orpc.dev) as of Sep 2026.
   - **Risk**: oRPC is a much younger project than tRPC — smaller community, API surface (`os.$context()`, `.use()`, `.middleware()`) confirmed against current docs but has less production mileage. Worth asking the user if they're OK trading tRPC's maturity for Nuxt-fit.

2. **better-auth for auth + multi-tenancy** — chosen over rolling custom auth or an external SaaS (Clerk/Auth0). Self-hosted, TS-first, has a Drizzle adapter (`@better-auth/drizzle-adapter`) and an `organization` plugin that gives us multi-tenancy (org/member/invitation tables) without hand-building it.
   - **Assumption baked in**: one `organization` = one tenant, B2B-style "user belongs to N orgs, acts as one at a time via `session.activeOrganizationId`." If the actual product is B2C / single-tenant-per-user, this entire org layer is unnecessary complexity and should come out.
   - **Caveat**: `packages/db/src/schema/auth.ts` was hand-written to match documented table shapes (user/session/account/verification/organization/member/invitation) so the repo has something to point Drizzle at before the first install. better-auth's own guidance is to generate this via `npx auth@latest generate` — that command should be run for real once `packages/auth` exists, and the hand-written file should be treated as provisional, not authoritative.

3. **Drizzle + Postgres, shared-DB multi-tenancy** — every tenant-owned row carries `organizationId`; no schema-per-tenant or DB-per-tenant. Simplest option, fine until there's a real enterprise-isolation requirement. Not discussed with the user explicitly — flagged as an assumption.

4. **Billing: Polar as default provider, Stripe as a swappable second implementation** — both live behind one `BillingProvider` interface (`createCheckoutSession` / `createPortalSession` / `verifyWebhook`) in `packages/billing`, selected by a single `BILLING_PROVIDER` env var. Reasoning: Polar is Merchant of Record (handles global VAT/sales tax), which is the better 2026 default for an indie/solo SaaS; Stripe is kept as the fallback for US-only or Connect/marketplace needs.
   - **Assumption**: only one provider active at a time, globally, not per-organization. No support for "some tenants pay via Stripe, some via Polar."
   - **Unverified detail**: Polar checkout call shape assumed to be `polar.checkouts.create({ products: [priceId], customerEmail, successUrl, metadata })` based on current `@polar-sh/sdk` docs/examples — not yet run against the real SDK types, could drift.

5. **Turborepo + pnpm workspaces** over Nx — lighter config surface, no plugin system to learn, standard choice in the Nuxt/Vue ecosystem. Not really contestable but worth listing as a decision.

6. **"Light DDD," not tactical DDD** — no aggregates/entities/value-objects/domain-events layer. Instead: `packages/api/src/domain/<domain>/*.service.ts` holds business logic as plain functions taking `Database` + primitives, `packages/api/src/router/<domain>.router.ts` holds the oRPC procedures (application layer) that call into those services, `packages/db` is the infrastructure layer (schema + client). Organized *by domain* (`tenant`, `billing`, later `auth`/`user`), not by technical layer (`controllers/`, `services/`, `models/`) at the top level.
   - **Assumption**: this is "enough DDD" for a quick-start scaffold. If the user actually wants full tactical DDD (repositories as interfaces, domain events, aggregate invariants), that's a bigger, more opinionated rewrite — worth confirming intent before going further, since it directly trades off against the "quick scaffold" goal.

7. **Two Nuxt apps** (`apps/web` marketing, `apps/app` authenticated dashboard) rather than one — not yet built, but was the plan. This is the common SaaS-starter split (separate concerns/deploys/caching) but doubles the Nuxt config surface. **Not confirmed with the user** — could just as easily be one app with route groups for a "quick scaffold."

## Open questions worth grilling

- Single Nuxt app vs. two (web + app)?
- Is multi-org-per-user (B2B) actually the target, or is single-tenant-per-user (B2C) enough — this changes whether `organization`/`member`/`invitation` exist at all?
- Full tactical DDD, or is the light domain/router/db split above sufficient?
- Testing strategy — nothing decided (Vitest for units? Playwright for e2e?).
- Lint/format — nothing decided (ESLint flat config + Prettier? Biome?).
- CI — nothing set up.
- Deploy target — nothing decided (affects whether Nitro preset needs pinning, e.g. Vercel/Cloudflare/Node).
- Should `packages/ui` be a real design system (shadcn-vue-based) or stay a thin placeholder until an app needs real components?
- Is Polar-as-MoR actually right for this user's situation (e.g. US-only business would lean Stripe-first instead)?

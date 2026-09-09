---
name: bootstrap-project
description: Turn this Ballast template clone into a real project — capture the business context, confirm or change the design system, rename the codebase, confirm the billing provider, check whether Lettr/billing credentials are actually real yet (skippable, revisit anytime), decide whether to keep or delete the _example reference code, and hand off to setup-matt-pocock-skills. Run once, right after cloning the template, before building any product pages.
disable-model-invocation: true
---

# Bootstrap this project

Ballast is a template: this skill is the one-time process that turns a clone of it into
*your* project. Run it before building any real product page — `design-a-page` assumes
the business context this skill captures has already been settled.

Prompt-driven, not a script: explore what's here, ask, confirm, then write. Take the
sections in order, one at a time. Lead each with the recommended default so the user can
accept it in a word; skip a section's explainer when the choice doesn't genuinely branch.

## 1. Business brief

Ask, in plain language:

- What does this product do, in one sentence?
- Who is it for?
- What's the core entity or two it revolves around — the thing users create or manage?

Don't try to fully model the domain here — that's what `domain-modeling` is for, done per
page as real pages get built. This is just enough to inform the steps below: naming, plan
tiers, and whether the `_example` note-taking pattern is a good template for the real
first feature.

Write the answer into `CONTEXT.md`, replacing its current one-line intro ("Ballast is a
scaffold for spinning up SaaS-shaped web applications...") with a description of the real
product. Leave the rest of `CONTEXT.md`'s glossary (Organization, Member, User,
Invitation, Plan, Subscription, Platform admin) alone — it's still accurate boilerplate
vocabulary for the real project.

## 2. Design system

Ask: keep the shipped indigo/Work Sans palette (`apps/web/app/assets/css/tailwind.css`),
or pick a new direction? Every gated page built so far (auth, organization settings,
billing, admin) is styled against CSS custom properties (`--primary`, `--background`,
`--destructive`, ...), never a literal hex code in component markup — so a re-theme is
cheap: editing the `:root`/`.dark` token blocks and the Google Fonts `@import` restyles
every page at once, nothing else needs to change.

Default: keep it — the current palette isn't tied to any particular product, so there's
no real cost to leaving it. If the user wants a new direction, load `frontend-design` for
aesthetic direction, then update the tokens. Don't re-ask per page afterward — the
direction is now settled project-wide, same as it was for Ballast itself.

## 3. Rename

Two renames, genuinely different in cost — offer them separately rather than bundling
them into one "rename everything" pass.

**Display name** (cheap — just do it): the name a user or operator actually sees.
`CONTEXT.md`'s title, `README.md`, `docker-compose.yml`'s `POSTGRES_DB` and volume name,
`.env.example`'s `DATABASE_URL` database name, the root `package.json` `name` field, the
brand text in `apps/web/app/layouts/app.vue`'s header
(`<NuxtLink to="/">Ballast</NuxtLink>`) — and, easy to miss, every centered-card auth page
(sign-in, sign-up, forgot/reset-password, onboarding, accept-invitation) repeats that
brand text in its own logo `<div>` rather than sharing `layouts/app.vue`'s header, since
they render before a session exists. The admin page's subtitle and the invitation email's
HTML (`packages/auth/src/email.ts`) say it too. Actually `grep -ri ballast` fresh across
the repo before you stop — this list is exactly the kind that goes stale as the app
grows, and it already has once (see marhyn/ballast#2's first bootstrap run, which missed
all of the above on the first pass and had to go back for them).

Running more than one Ballast-derived project locally at once (this template plus a
project bootstrapped from it, say)? `docker-compose.yml`'s host port (`5432`) and Nuxt's
dev-server port (`3000`, via `PORT` in `.env`) will collide across projects if both run
their stacks at the same time — reassign one side's ports (and `APP_URL`/
`BETTER_AUTH_URL` to match) rather than discovering it as a mysterious bind failure.

**Internal package scope** (`@ballast/api`, `@ballast/db`, `@ballast/billing`, ...):
optional — offer it, but default to *skip*. These are private, unpublished workspace
package names, invisible to anyone outside the codebase. Renaming touches every
`packages/*/package.json` `name` field and every corresponding
`import ... from "@ballast/..."` across the repo — a large, purely cosmetic diff for
close to zero user-facing benefit. Only do it if the user actually asks for it; if so,
grep `@ballast/` fresh (don't hardcode a file list — it drifts) and run `pnpm typecheck`
afterward to catch anything a text search missed.

**Don't touch**: `docs/adr/*.md` prose. ADRs are a point-in-time record of decisions made
while the project was still called Ballast — rewriting them to say a different name would
misrepresent when those calls were actually made. Leave them as historical record.

Also delete `HANDOFF.md` if it's still present in the clone — it was a scratch doc from
Ballast's own early bootstrap, fully superseded by the ADRs it fed into. Leaving it in a
finished project is actively misleading (it still claims most of the app "doesn't exist
yet").

## 4. Billing provider

Confirm `BILLING_PROVIDER` in `.env` (`polar` or `stripe` — see `docs/adr/0002-polar-
default-billing-provider.md` for why Polar's the default). Remind the user to fill in the
matching credentials (`POLAR_ACCESS_TOKEN`/`POLAR_WEBHOOK_SECRET`, or
`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`).

Then walk `packages/billing/src/plans.ts`: its Starter/Pro/Business tiers are generic
placeholders. Using the business brief from step 1, ask what the real plans are named,
priced, and what each includes, and rewrite the list to match. The `priceIds` need real
product/price IDs from the provider's own dashboard — that's an external step only the
user can do. If they don't have them yet, leave the `REPLACE_WITH_...` placeholders in
place with a comment that checkout will fail until they're filled in, rather than
inventing plausible-looking IDs.

## 5. Verify integrations (skippable — safe to revisit anytime)

Step 4 asked the user to fill in real credentials; this step actually checks whether they
did, rather than trusting the reminder landed. Two things gate real functionality here,
independent of each other:

- **Lettr** (`LETTR_API_KEY` in `.env`) — every better-auth email goes through it:
  password reset, email verification, organization invitations. None of these require it
  to work for sign-up/sign-in/session/org-switching to work — those don't send email at
  all — but without a real key, a user who clicks "forgot password" or gets invited to an
  Organization never receives anything, even though the app behaves as if it worked.
- **The active billing provider's credentials** (`POLAR_ACCESS_TOKEN`/
  `POLAR_WEBHOOK_SECRET`, or `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, whichever
  `BILLING_PROVIDER` selects) and `packages/billing/src/plans.ts`'s `priceIds` — without
  real values, checkout fails outright (a real error from the provider's API, not a silent
  no-op — confirmed by actually clicking through it during marhyn/ballast#2's bootstrap
  runs).

Detect placeholders by pattern, not by calling the provider: empty, or still reading
`dev-fake-...`, `change-me`, or the literal placeholder text `.env.example`/`plans.ts`
shipped with — none of that has been replaced with something real yet.

Tell the user plainly which of the two are still placeholders and what that breaks in
practice (the two bullets above, in their own words) — don't just say "integrations
incomplete." Then stop there: this is not a blocker on finishing bootstrap, and there's
nothing to schedule or track. The check is only ever "read `.env` and `plans.ts` right
now" — no state lives anywhere else, so filling in real values later and re-running this
step (or asking to recheck integrations at any point, mid-project) picks up the change
immediately with nothing else to update first.

## 6. The `_example` domain: keep or delete

`packages/db/src/schema/example.ts` and everything built on it (an oRPC domain service, a
router, and the `/example` page) are a worked reference for the full pattern — schema →
domain service → router → route guard → page → test — marked "safe to delete"
everywhere it appears. Ask whether to keep it around as a live reference while building
the first real feature, or delete it now that the pattern's been read.

If deleting, remove all of the following (grep for `example`/`exampleNote`/`ExampleNote`
fresh first to catch anything this list has missed):

- `packages/db/src/schema/example.ts`, and its `export * from "./example"` line in
  `packages/db/src/schema/index.ts`
- `packages/api/src/domain/example/` (the service and its test)
- `packages/api/src/router/example.router.ts`, and its import, mount line, and the
  "TEMPLATE EXAMPLE" comment in `packages/api/src/router/index.ts`
- `apps/web/app/pages/example/`

Then run `pnpm db:generate` (creates the `DROP TABLE example_note` migration) followed by
`pnpm db:migrate`, and finish with `pnpm typecheck && pnpm lint && pnpm test` to confirm
nothing still references the removed code.

## 7. Hand off

Once the above is settled, tell the user to run `/setup-matt-pocock-skills` next — it
configures *this* project's own issue tracker, triage labels, and domain-doc layout (it
explores the current git remote fresh, so it works correctly once the user has
re-pointed this repo at their own GitHub/GitLab remote). Don't invoke it automatically as
part of this wizard: it asks its own confirmation questions, and the user should engage
with those directly rather than have them fire as a side effect of a different skill.

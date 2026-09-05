---
name: design-a-page
description: Design a new page for a Ballast app using Claude Design before writing any code — draft a canvas, iterate with the user, then implement it against the real stack (Nuxt, shadcn-vue, oRPC, route guards). Use when starting a new page, screen, or flow, or when asked to "design" or "mock up" part of the app.
---

# Design a page

Ballast pages get designed before they get built — visually, in Claude Design, against the actual content and states the page needs — not sketched directly in code. This skill is the bridge between "we need a pricing page" and a merged PR.

## Process

### 1. Scope the page

Before opening a canvas, pin down:

- **Route**: where it lives under `apps/web/app/pages/...`.
- **Access**: public or gated (per ADR-0006's route-level auth guard — most pages are one or the other; some are both: public shell, gated action).
- **Data**: what it needs to show, and which `packages/api` router (existing or new) supplies it. If the router doesn't exist yet, note that as a prerequisite — don't invent data shapes in the mockup that the API can't actually produce.
- **States**: at minimum, loaded, empty, and error. Add loading/skeleton if the data fetch is non-trivial.

### 2. Draft the canvas

Use the `design` skill to publish a Claude Design canvas covering the states from step 1. Load `frontend-design` first for aesthetic direction — Ballast uses shadcn-vue specifically so every project built on this template can look distinct (see the UI-library ADR); don't let every page default to the generic shadcn look.

Share the canvas link. The user can edit it directly (click-to-select, inline text, properties panel) or give feedback for another pass.

### 3. Iterate

Repeat step 2 until the user approves the design. Don't start implementing before approval — the whole point is catching layout and content problems before they're baked into Vue components.

### 4. Implement

Once approved:

- Generate any missing shadcn-vue components via its CLI into `apps/web/app/components/ui/` — don't hand-roll what the CLI already provides.
- Build the page under `apps/web/app/pages/...`, matching the approved canvas.
- Apply the route guard from step 1 (public/gated) via Nuxt route middleware.
- Wire data through the oRPC router identified in step 1. If it doesn't exist yet, build it in `packages/api` first (domain service → router, per the light-DDD ADR) — don't fetch data ad hoc from the page.

### 5. Capture new domain vocabulary

If the page surfaced a term not yet in `CONTEXT.md` (e.g. a new entity like "Listing"), route it through `/domain-modeling` rather than silently introducing it in code or component names.

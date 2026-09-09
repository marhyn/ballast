## Agent skills

### Issue tracker

Issues live as GitHub issues on `marhyn/ballast` (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), already created as GitHub labels on the repo. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Page design

New pages get designed on a Claude Design canvas and approved before any code is written. See `.claude/skills/design-a-page/SKILL.md`.

### Bootstrap a new project

Run once, right after cloning this template, before building any product pages: captures the business context, confirms the design system and billing provider, checks whether Lettr/billing credentials are real yet (skippable, revisit anytime), renames the codebase, and decides the fate of the `_example` reference code. See `.claude/skills/bootstrap-project/SKILL.md`.

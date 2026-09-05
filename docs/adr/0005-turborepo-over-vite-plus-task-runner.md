# Turborepo for task orchestration, despite adopting Vite+'s Oxlint/Oxfmt

Vite+ (VoidZero's unified `vp` CLI) could replace Turborepo outright — it has its own dependency-aware task runner with caching — but its handling of persistent/concurrent tasks is a documented gap: multiple `dev` watch processes run topologically rather than concurrently, which breaks exactly the `pnpm dev` case of running several dev servers at once. We adopt Vite+'s Oxlint and Oxfmt for lint/format (a clean improvement with no such gap) but keep Turborepo for orchestration until Vite+'s task runner matures.

# One Nuxt app with route-level auth guards, not a marketing-site/dashboard split

We initially assumed the common SaaS-starter shape — a public marketing app plus a fully-authenticated dashboard app — but that breaks for products where public and gated content share a layout (e.g. a marketplace listing page that's publicly viewable but carries a gated "make an offer" action), which is the shape Ballast actually needs to support. A single app with per-route auth middleware handles both extremes: a pure SaaS dashboard just gates nearly every route, a marketplace-like product gates only a few.

# Ballast

Ballast is a scaffold for spinning up SaaS-shaped web applications: Nuxt on the frontend, oRPC for the typed API layer, Drizzle/Postgres for storage, better-auth for identity and multi-tenancy, Polar/Stripe for billing.

## Language

**Organization**:
The tenant — the account boundary that owns data, subscriptions, and members. A User can belong to multiple Organizations and acts as one at a time (the active Organization, tracked on their Session).
_Avoid_: Tenant, Workspace, Account (as a synonym for Organization)

**Member**:
The join between a User and an Organization, carrying the User's role within that Organization.
_Avoid_: Membership, Team member

**User**:
A person with credentials, independent of any Organization. A User's identity survives leaving every Organization they belong to.
_Avoid_: Account, Customer

**Invitation**:
A pending offer for a User (by email) to join an Organization with a given role.
_Avoid_: Invite (as a noun for the record itself)

**Plan**:
A named, priced tier of features an Organization can subscribe to (e.g. Starter, Pro). Defined in code (`packages/billing/src/plans.ts`), not persisted — see ADR-0010.
_Avoid_: Tier, Package

**Subscription**:
An Organization's paid relationship with a Plan, mediated by a billing provider (Polar or Stripe, see ADR-0002) and persisted per-Organization. Carries the provider's own customer/subscription ids and the current billing status.
_Avoid_: Customer (as a synonym — an Organization subscribes, not a "Customer" entity in this app's own domain)

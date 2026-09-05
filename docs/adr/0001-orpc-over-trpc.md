# oRPC over tRPC for the typed API layer

We considered tRPC given its market dominance and battle-tested React ecosystem, but Ballast is Nuxt-first: tRPC's client is shaped around React Query, and its Vue/Nuxt support (`trpc-nuxt`) is a thin community wrapper rather than a first-party integration. We chose oRPC instead — it has a first-class Nuxt/Nitro adapter and produces an OpenAPI-compatible contract as a side effect — at the cost of a younger, smaller-community library with less production mileage than tRPC.

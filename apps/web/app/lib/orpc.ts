import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouter } from "@ballast/api";

// `url` must be absolute — RPCLink builds a `new URL(...)` internally, which
// throws on a bare path with no base. Only ever called client-side (all
// orpc.* calls in this app are deferred to onMounted), so `window` is always
// defined by call time.
const link = new RPCLink({
  url: () => `${window.location.origin}/rpc`,
});

export const orpc: RouterClient<AppRouter> = createORPCClient(link);

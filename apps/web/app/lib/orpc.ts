import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouter } from "@ballast/api";

const link = new RPCLink({ url: "/rpc" });

export const orpc: RouterClient<AppRouter> = createORPCClient(link);

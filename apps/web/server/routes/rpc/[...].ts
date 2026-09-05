import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { router, createContext } from "@ballast/api";
import { auth } from "@ballast/auth";

const handler = new RPCHandler(router, {
  interceptors: [onError((error) => console.error(error))],
});

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);
  const authSession = await auth.api.getSession({ headers: request.headers });

  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: createContext(authSession),
  });

  if (response) {
    return response;
  }

  setResponseStatus(event, 404);
  return "Not found";
});

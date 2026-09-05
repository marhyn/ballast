import { auth } from "@ballast/auth";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});

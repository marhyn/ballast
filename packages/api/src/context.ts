import { db, type Database } from "@ballast/db";
import type { auth } from "@ballast/auth";

type AuthSession = typeof auth.$Infer.Session;

export interface Context {
  db: Database;
  user: AuthSession["user"] | null;
  organizationId: string | null;
}

/** `authSession` is whatever `auth.api.getSession()` returned for the incoming request. */
export function createContext(authSession: AuthSession | null): Context {
  return {
    db,
    user: authSession?.user ?? null,
    organizationId: authSession?.session.activeOrganizationId ?? null,
  };
}

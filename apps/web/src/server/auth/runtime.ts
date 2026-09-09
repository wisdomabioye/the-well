import {
  createSessionService,
  createDrizzleSessionRepository,
} from "@ador/auth";
import {
  createAuthorizationService,
  createDrizzleAuthorizationRepository,
} from "@ador/authorization";
import {
  createDatabaseClient,
  createDatabasePool,
  parseDatabaseEnvironment,
} from "@ador/database/connection";
import { parseAuthSessionEnvironment } from "@repo/config/env";

import { authorizationPolicy } from "../../../../../configs/authorization";
import type { PageAccessDependencies } from "./page-access.ts";

let services: PageAccessDependencies | undefined;

export function getPageAccessDependencies(): PageAccessDependencies {
  if (services) return services;
  const databaseEnvironment = parseDatabaseEnvironment(process.env);
  const authEnvironment = parseAuthSessionEnvironment(process.env);
  const database = createDatabaseClient(
    createDatabasePool(databaseEnvironment),
  );
  const sessions = createSessionService({
    clock: () => new Date(),
    idleLifetimeMs: authEnvironment.AUTH_SESSION_IDLE_TIMEOUT_MS,
    repository: createDrizzleSessionRepository(database),
  });
  const authorization = createAuthorizationService({
    policy: authorizationPolicy,
    repository: createDrizzleAuthorizationRepository(database),
  });
  services = {
    findSession: sessions.find,
    forPlatform: authorization.forPlatform,
  };
  return services;
}

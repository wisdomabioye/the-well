import {
  createDrizzlePasskeyRepository,
  createPasskeyLinkingService,
  simpleWebAuthnRegistrationAdapter,
} from "@ador/auth";
import {
  createDatabaseClient,
  createDatabasePool,
  parseDatabaseEnvironment,
} from "@ador/database/connection";
import {
  parseAuthSessionEnvironment,
  parseEnvironment,
} from "@repo/config/env";

let service: ReturnType<typeof createPasskeyLinkingService> | undefined;

export function getPasskeyLinkingService() {
  if (service) return service;
  const app = parseEnvironment(process.env);
  const policy = parseAuthSessionEnvironment(process.env);
  const origin = new URL(app.PUBLIC_BASE_URL);
  const database = createDatabaseClient(
    createDatabasePool(parseDatabaseEnvironment(process.env)),
  );
  service = createPasskeyLinkingService({
    adapter: simpleWebAuthnRegistrationAdapter,
    clock: () => new Date(),
    policy: {
      challengeLifetimeMs: policy.PASSKEY_CHALLENGE_TIMEOUT_MS,
      expectedOrigin: origin.origin,
      recentAuthenticationWindowMs: policy.PASSKEY_RECENT_AUTH_WINDOW_MS,
      relyingPartyId: origin.hostname,
      relyingPartyName: app.NEXT_PUBLIC_APP_NAME,
      sessionAbsoluteLifetimeMs: policy.AUTH_SESSION_ABSOLUTE_TIMEOUT_MS,
      sessionIdleLifetimeMs: policy.AUTH_SESSION_IDLE_TIMEOUT_MS,
    },
    repository: createDrizzlePasskeyRepository(database),
  });
  return service;
}

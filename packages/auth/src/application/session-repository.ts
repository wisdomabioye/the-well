import type { UuidV7 } from "@ador/shared/identifiers";

export interface ActiveSession {
  readonly absoluteExpiresAt: Date;
  readonly authenticatedAt: Date;
  readonly idleExpiresAt: Date;
  readonly sessionId: UuidV7;
  readonly userId: UuidV7;
}

export interface SessionRepository {
  findAndRenew(input: {
    readonly idleLifetimeMs: number;
    readonly now: Date;
    readonly tokenHash: string;
  }): Promise<ActiveSession | null>;
  revoke(tokenHash: string, revokedAt: Date): Promise<boolean>;
}

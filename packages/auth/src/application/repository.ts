import type {
  BitcoinNetwork,
  ValidatedBitcoinAddress,
} from "@ador/chain/bitcoin";
import type { UuidV7 } from "@ador/shared/identifiers";

import type { WalletAuthAction } from "../domain/contracts.ts";

export interface StoredWalletChallenge {
  readonly action: WalletAuthAction;
  readonly address: ValidatedBitcoinAddress;
  readonly attempts: number;
  readonly challengeId: UuidV7;
  readonly consumedAt: Date | null;
  readonly domain: string;
  readonly expectedUserId: UuidV7 | null;
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly messageHash: string;
  readonly network: BitcoinNetwork;
  readonly nonce: string;
  readonly origin: string;
  readonly requestId: UuidV7;
  readonly scriptIdentity: string;
  readonly uri: string;
  readonly walletAdapter: string;
}

export interface SessionMaterial {
  readonly absoluteExpiresAt: Date;
  readonly idleExpiresAt: Date;
  readonly tokenHash: string;
}

export type ConsumeChallengeResult =
  | { readonly kind: "consumed"; readonly userId: UuidV7 }
  | { readonly kind: "expired" }
  | { readonly kind: "identity-conflict" }
  | { readonly kind: "invalid" }
  | { readonly kind: "unavailable" };

export interface WalletAuthRepository {
  findChallenge(challengeId: UuidV7): Promise<StoredWalletChallenge | null>;
  incrementFailedAttempt(
    challengeId: UuidV7,
    maximumAttempts: number,
  ): Promise<void>;
  issueChallenge(challenge: StoredWalletChallenge): Promise<void>;
  consumeChallenge(
    challenge: StoredWalletChallenge,
    session: SessionMaterial,
    now: Date,
    maximumAttempts: number,
  ): Promise<ConsumeChallengeResult>;
}

export {
  BIP322_SIGNATURE_SCHEME,
  WALLET_CHALLENGE_SCHEMA_VERSION,
  walletAuthActions,
  type IssuedWalletChallenge,
  type WalletAuthenticationFailure,
  type WalletAuthenticationResult,
  type WalletAuthAction,
  type WalletChallengeMessage,
  type WalletSignatureVerifier,
  type WalletAuthPolicy,
  type IssueWalletChallengeInput,
  type VerifyWalletChallengeInput,
} from "./domain/contracts.ts";
export { serializeWalletChallenge } from "./domain/serialize-challenge.ts";
export { createWalletAuthService } from "./application/service.ts";
export { createDrizzleWalletAuthRepository } from "./adapters/drizzle-wallet-auth-repository.ts";
export { createDrizzleSessionRepository } from "./adapters/drizzle-session-repository.ts";
export { createSessionService } from "./application/session-service.ts";
export type {
  ActiveSession,
  SessionRepository,
} from "./application/session-repository.ts";

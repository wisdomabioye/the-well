import type { WalletChallengeMessage } from "./contracts.ts";

const NO_TRANSACTION_NOTICE =
  "This request will not create or broadcast a transaction.";

export function serializeWalletChallenge(
  challenge: WalletChallengeMessage,
): string {
  return [
    `${challenge.domain} requests a Bitcoin wallet signature.`,
    NO_TRANSACTION_NOTICE,
    "",
    `URI: ${challenge.uri}`,
    `Origin: ${challenge.origin}`,
    `Address: ${challenge.address}`,
    `Network: ${challenge.network}`,
    `Action: ${challenge.action}`,
    `Nonce: ${challenge.nonce}`,
    `Issued At: ${challenge.issuedAt.toISOString()}`,
    `Expires At: ${challenge.expiresAt.toISOString()}`,
    `Request ID: ${challenge.requestId}`,
    `Challenge ID: ${challenge.challengeId}`,
    `Schema Version: ${String(challenge.schemaVersion)}`,
    `Signature Scheme: ${challenge.signatureScheme}`,
  ].join("\n");
}

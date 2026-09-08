import { createUuidV7 } from "@ador/shared/identifiers";
import { Signer } from "bip322-js";

export const walletPrivateKey =
  "L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k";
export const walletAddress = "tb1q9vza2e8x573nczrlzms0wvx3gsqjx7vaxwd45v";

export function signWalletMessage(message: string): string {
  return Signer.sign(walletPrivateKey, walletAddress, message);
}

export const walletAuthPolicy = {
  challengeLifetimeMs: 60_000,
  maximumVerificationAttempts: 2,
  sessionAbsoluteLifetimeMs: 86_400_000,
  sessionIdleLifetimeMs: 3_600_000,
};

export function validChallengeInput() {
  return {
    action: "sign-in" as const,
    address: walletAddress,
    network: "signet" as const,
    origin: "https://launch.example",
    requestId: createUuidV7(),
    uri: "https://launch.example/auth/wallet",
    walletAdapter: "lasereyes",
  };
}

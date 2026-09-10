import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";

import { sha256 } from "../domain/crypto.ts";
import type {
  AuthenticatorTransport,
  PasskeyRegistrationAdapter,
  PasskeyRegistrationPayload,
} from "./contracts.ts";

const supportedTransports: readonly AuthenticatorTransport[] = [
  "ble",
  "cable",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
];

function isSupportedTransport(value: string): value is AuthenticatorTransport {
  return supportedTransports.some((candidate) => candidate === value);
}

function toVendorPayload(
  payload: PasskeyRegistrationPayload,
): RegistrationResponseJSON {
  return {
    ...payload,
    clientExtensionResults: { ...payload.clientExtensionResults },
    response: {
      ...payload.response,
      transports: payload.response.transports
        ? [...payload.response.transports]
        : undefined,
    },
  };
}

export const simpleWebAuthnRegistrationAdapter: PasskeyRegistrationAdapter = {
  async createOptions(input) {
    const options = await generateRegistrationOptions({
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      challenge: new Uint8Array(Buffer.from(input.challenge, "base64url")),
      excludeCredentials: input.existingCredentialIds.map((id) => ({ id })),
      rpID: input.relyingPartyId,
      rpName: input.relyingPartyName,
      userDisplayName: input.userName,
      userID: new TextEncoder().encode(input.userId),
      userName: input.userName,
    });
    return {
      attestation: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      challenge: options.challenge,
      excludeCredentials: input.existingCredentialIds.map((id) => ({
        id,
        type: "public-key" as const,
      })),
      pubKeyCredParams: options.pubKeyCredParams.map(({ alg }) => ({
        alg,
        type: "public-key" as const,
      })),
      rp: options.rp,
      timeout: options.timeout,
      user: options.user,
    };
  },
  async verify(input) {
    try {
      const result = await verifyRegistrationResponse({
        expectedChallenge: (value) => sha256(value) === input.challengeHash,
        expectedOrigin: input.expectedOrigin,
        expectedRPID: input.relyingPartyId,
        requireUserPresence: true,
        requireUserVerification: true,
        response: toVendorPayload(input.payload),
      });
      if (!result.verified) return null;
      const { credential, credentialBackedUp, credentialDeviceType } =
        result.registrationInfo;
      return {
        backedUp: credentialBackedUp,
        counter: credential.counter,
        credentialId: credential.id,
        deviceType: credentialDeviceType,
        publicKey: credential.publicKey,
        transports: (credential.transports ?? []).filter(isSupportedTransport),
      };
    } catch {
      return null;
    }
  },
};

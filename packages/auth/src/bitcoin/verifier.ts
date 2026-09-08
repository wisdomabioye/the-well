import { Verifier } from "bip322-js";

import type { WalletSignatureVerifier } from "../domain/contracts.ts";

export const strictBip322Verifier: WalletSignatureVerifier = {
  verify({ address, message, signature }) {
    try {
      return Verifier.verifySignature(address, message, signature, true);
    } catch {
      return false;
    }
  },
};

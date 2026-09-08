import { describe, expect, it } from "vitest";

import {
  walletAuthActions,
  walletAuthActionSchema,
} from "../src/auth/wallet-auth-action.ts";

describe("wallet authentication actions", () => {
  it("keeps the persisted and signed action vocabulary closed", () => {
    expect(walletAuthActions).toEqual(["sign-in", "link-wallet", "step-up"]);
    expect(walletAuthActionSchema.safeParse("sign-in").success).toBe(true);
    expect(walletAuthActionSchema.safeParse("register").success).toBe(false);
  });
});

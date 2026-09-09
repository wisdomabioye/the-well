import { z } from "zod";

export const walletAuthActions = ["sign-in", "link-wallet", "step-up"] as const;

export const walletAuthActionSchema = z.enum(walletAuthActions);

export const platformSessionCookieName = "__Host-ador-session";

export type WalletAuthAction = z.infer<typeof walletAuthActionSchema>;

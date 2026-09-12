import type { WalletNetwork } from "../contracts.ts";

export const laserEyesProviderIds = [
  "binance",
  "keplr",
  "leather",
  "magic-eden",
  "okx",
  "op_net",
  "orange",
  "oyl",
  "phantom",
  "sparrow",
  "tokeo",
  "unisat",
  "wizz",
  "xverse",
] as const;

export type LaserEyesProviderId = (typeof laserEyesProviderIds)[number];
export type WalletCapability = "connect" | "message-sign" | "psbt-sign";
export type WalletConformanceOutcome = "failed" | "passed";

export type WalletConformanceCheck =
  | "account-change"
  | "alkanes-fixture-matched"
  | "connect-approved"
  | "connect-rejected"
  | "message-approved"
  | "message-rejected"
  | "message-server-verified"
  | "network-change"
  | "psbt-approved"
  | "psbt-rejected"
  | "psbt-server-verified";

export interface WalletQualificationCandidate {
  readonly capabilities: readonly WalletCapability[];
  readonly provider: LaserEyesProviderId;
  readonly walletVersion: string;
}

export interface WalletTestEnvironment {
  readonly browser: Readonly<{ name: string; version: string }>;
  readonly device: Readonly<{
    category: "desktop" | "mobile";
    os: string;
  }>;
}

export interface WalletQualificationEvidence extends WalletTestEnvironment {
  readonly addressType: "p2tr" | "p2wpkh";
  readonly check: WalletConformanceCheck;
  readonly fixtureId: string;
  readonly network: WalletNetwork;
  readonly observedAt: string;
  readonly outcome: WalletConformanceOutcome;
  readonly provider: LaserEyesProviderId;
  readonly signingScheme: "bip322" | "legacy" | "not-applicable";
  readonly versions: Readonly<{ core: string; react: string }>;
  readonly walletVersion: string;
}

export interface WalletQualificationPolicy {
  readonly addressTypes: readonly WalletQualificationEvidence["addressType"][];
  readonly environments: readonly WalletTestEnvironment[];
  readonly fixtureId: string;
  readonly maximumEvidenceAgeMs: number;
  readonly messageSigningSchemes: readonly Exclude<
    WalletQualificationEvidence["signingScheme"],
    "not-applicable"
  >[];
  readonly networks: readonly WalletNetwork[];
}

export interface QualifiedWalletProvider {
  readonly capabilities: readonly WalletCapability[];
  readonly provider: LaserEyesProviderId;
  readonly walletVersion: string;
}

export interface WalletQualificationResult {
  readonly enabled: readonly QualifiedWalletProvider[];
  readonly failures: readonly string[];
}

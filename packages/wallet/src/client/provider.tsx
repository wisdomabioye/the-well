"use client";

import { LaserEyesProvider } from "@omnisat/lasereyes-react";
import type { ReactNode } from "react";

import type { WalletNetwork } from "../contracts.ts";

interface WalletProviderProps {
  readonly children: ReactNode;
  readonly network: WalletNetwork;
}

export function WalletProvider({ children, network }: WalletProviderProps) {
  return <LaserEyesProvider config={{ network }}>{children}</LaserEyesProvider>;
}

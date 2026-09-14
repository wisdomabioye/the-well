"use client";

import { useState } from "react";
import { useWalletConnection } from "@ador/wallet/client";
import type { WalletCandidate } from "../config.ts";

function abbreviated(address: string): string {
  return address.length <= 18
    ? address
    : `${address.slice(0, 8)}…${address.slice(-8)}`;
}

export function WalletConnectPanel({
  candidates,
}: {
  readonly candidates: readonly WalletCandidate[];
}) {
  const wallet = useWalletConnection();
  const [error, setError] = useState<string | null>(null);

  if (wallet.connected) {
    return (
      <div className="arcade-actions">
        <p role="status">
          Connected to {wallet.provider ?? "wallet"} on {wallet.network}:{" "}
          {abbreviated(wallet.address)}
        </p>
        <p>
          Connection is ready for qualification. It does not create a platform
          session or prove wallet support.
        </p>
        <button
          className="arcade-button arcade-button--yellow"
          onClick={wallet.disconnect}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="arcade-actions">
      {candidates.map((candidate) =>
        wallet.isInstalled(candidate.id) ? (
          <button
            className="arcade-button arcade-button--cyan"
            disabled={wallet.connecting}
            key={candidate.id}
            onClick={() => {
              setError(null);
              void wallet.connect(candidate.id).catch(() => {
                setError(
                  `${candidate.label} connection was rejected or failed.`,
                );
              });
            }}
            type="button"
          >
            {wallet.connecting ? "Connecting…" : `Connect ${candidate.label}`}
          </button>
        ) : (
          <a
            className="arcade-button arcade-button--yellow"
            href={wallet.installationUrl(candidate.id)}
            key={candidate.id}
            rel="noreferrer"
            target="_blank"
          >
            Install {candidate.label}
          </a>
        ),
      )}
      {error === null ? null : <p role="alert">{error}</p>}
    </div>
  );
}

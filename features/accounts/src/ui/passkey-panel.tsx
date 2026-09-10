"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import {
  passkeyBeginResponseSchema,
  passkeyListResponseSchema,
  passkeyMutationResponseSchema,
} from "@ador/auth";
import { ArcadePanel, StatusLamp } from "@repo/ui/arcade";

type Status = "idle" | "working" | "success" | "error";

async function jsonRequest(
  path: string,
  method: "GET" | "POST",
  body?: object,
) {
  const response = await fetch(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined ? undefined : { "content-type": "application/json" },
    method,
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("Passkey request failed");
  return payload;
}

export function PasskeyPanel({
  initialCredentialIds,
  initialUnavailable,
}: {
  readonly initialCredentialIds: readonly string[];
  readonly initialUnavailable: boolean;
}) {
  const [credentialIds, setCredentialIds] = useState(initialCredentialIds);
  const [status, setStatus] = useState<Status>(
    initialUnavailable ? "error" : "idle",
  );
  const [message, setMessage] = useState(
    initialUnavailable
      ? "Passkey status is unavailable. No linked state is assumed."
      : "Linked passkeys are off-chain account methods only. Wallet and on-chain authority remain separate.",
  );

  async function refresh() {
    const payload = await jsonRequest("/api/v1/passkeys", "GET");
    setCredentialIds(passkeyListResponseSchema.parse(payload).credentialIds);
  }

  async function link() {
    setStatus("working");
    try {
      const begin = passkeyBeginResponseSchema.parse(
        await jsonRequest("/api/v1/passkeys/registration/options", "POST", {}),
      );
      const credential = await startRegistration({
        optionsJSON: begin.options,
      });
      passkeyMutationResponseSchema.parse(
        await jsonRequest("/api/v1/passkeys/registration/verify", "POST", {
          challengeId: begin.challengeId,
          credential,
        }),
      );
      await refresh();
      setStatus("success");
      setMessage("Passkey linked. Other sessions were revoked for safety.");
    } catch {
      setStatus("error");
      setMessage(
        "Passkey linking could not be confirmed. Refresh before trying again.",
      );
    }
  }

  async function unlink(credentialId: string) {
    setStatus("working");
    try {
      passkeyMutationResponseSchema.parse(
        await jsonRequest("/api/v1/passkeys/unlink", "POST", { credentialId }),
      );
      await refresh();
      setStatus("success");
      setMessage("Passkey removed. Other sessions were revoked for safety.");
    } catch {
      setStatus("error");
      setMessage(
        "Passkey removal could not be confirmed. Refresh before trying again.",
      );
    }
  }

  return (
    <ArcadePanel eyebrow="Account security" title="Linked passkeys">
      <StatusLamp
        label={message}
        tone={
          status === "success"
            ? "ready"
            : status === "error"
              ? "unavailable"
              : "attention"
        }
      />
      <ul>
        {credentialIds.map((credentialId, index) => (
          <li key={credentialId}>
            <span>Passkey {index + 1}</span>{" "}
            <button
              className="arcade-button arcade-button--yellow"
              disabled={status === "working"}
              onClick={() => unlink(credentialId)}
              type="button"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        className="arcade-button arcade-button--cyan"
        disabled={status === "working"}
        onClick={link}
        type="button"
      >
        Add passkey
      </button>
    </ArcadePanel>
  );
}

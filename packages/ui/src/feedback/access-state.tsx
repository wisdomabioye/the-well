import { AppShell } from "../patterns/app-shell.tsx";
import { ArcadeButton } from "../primitives/arcade-button.tsx";
import { ArcadePanel } from "../arcade/arcade-panel.tsx";
import { StatusLamp } from "../arcade/status-lamp.tsx";

const states = {
  forbidden: {
    action: "Return home",
    body: "Your active session does not have the required platform capability.",
    label: "Access denied",
    title: "Staff clearance required",
    tone: "unavailable",
  },
  unauthenticated: {
    action: "Return home",
    body: "Connect and authenticate with a supported wallet to enter this private route.",
    label: "Authentication required",
    title: "Insert player identity",
    tone: "attention",
  },
  unavailable: {
    action: "Try again",
    body: "Session verification is temporarily unavailable. No private content has been loaded.",
    label: "Verification unavailable",
    title: "System link interrupted",
    tone: "attention",
  },
} as const;

export function AccessState({
  retryHref = "/",
  state,
}: {
  readonly retryHref?: string;
  readonly state: keyof typeof states;
}) {
  const content = states[state];
  return (
    <AppShell
      brand="Adorbitals"
      footerLabel="Protected platform route"
      homeHref="/"
      navigation={[{ href: "/", label: "Home" }]}
      notices={["◆ PRIVATE ROUTE", "▲ SERVER VERIFIED", "★ FAIL CLOSED"]}
    >
      <section className="arcade-section arcade-section--raised">
        <StatusLamp label={content.label} tone={content.tone} />
        <ArcadePanel eyebrow="Route access" title={content.title}>
          <p>{content.body}</p>
          <ArcadeButton
            href={state === "unavailable" ? retryHref : "/"}
            tone="cyan"
          >
            {content.action}
          </ArcadeButton>
        </ArcadePanel>
      </section>
    </AppShell>
  );
}

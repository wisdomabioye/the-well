import type { UuidV7 } from "@ador/shared/identifiers";
import {
  AppShell,
  ArcadeButton,
  ArcadePanel,
  StatusLamp,
} from "@repo/ui/arcade";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/account", label: "Account", tone: "cyan" },
  { href: "/studio", label: "Studio", tone: "yellow" },
] as const;

const surfaces = {
  account: {
    eyebrow: "Player identity",
    status: "Authenticated session",
    title: "Account console",
    body: "Your wallet-backed platform session is active. Wallet connection alone never unlocks this surface.",
  },
  admin: {
    eyebrow: "Platform operations",
    status: "Staff capability verified",
    title: "Admin console",
    body: "Platform operations are available to an active staff assignment. Creator admission reviews are separated from broader platform authority.",
  },
  studio: {
    eyebrow: "Private workspace",
    status: "Authenticated access",
    title: "Creator studio",
    body: "Private creator-application drafts are available here. This session does not imply creator approval or publication authority.",
  },
} as const;

export function AccountSurface({
  actorUserId,
  surface,
}: {
  readonly actorUserId: UuidV7;
  readonly surface: keyof typeof surfaces;
}) {
  const content = surfaces[surface];
  return (
    <AppShell
      brand="Adorbitals"
      footerLabel="Authenticated beta workspace"
      homeHref="/"
      navigation={navigation}
      notices={["◆ SESSION VERIFIED", "▲ PRIVATE ROUTE", "★ SERVER AUTHORITY"]}
    >
      <section className="arcade-section arcade-section--raised">
        <StatusLamp label={content.status} tone="ready" />
        <p className="arcade-eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
        <ArcadePanel eyebrow="Current player" title="Session active">
          <p className="arcade-muted">User {actorUserId}</p>
          <div className="arcade-actions">
            <ArcadeButton href="/account" tone="cyan">
              Account
            </ArcadeButton>
            <ArcadeButton href="/studio" tone="yellow">
              Studio
            </ArcadeButton>
            {surface === "studio" ? (
              <ArcadeButton href="/studio/creator-application" tone="cyan">
                Creator application
              </ArcadeButton>
            ) : surface === "admin" ? (
              <ArcadeButton href="/admin/creator-applications" tone="yellow">
                Creator reviews
              </ArcadeButton>
            ) : null}
          </div>
        </ArcadePanel>
      </section>
    </AppShell>
  );
}

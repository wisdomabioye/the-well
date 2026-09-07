import {
  AppShell,
  ArcadeButton,
  ArcadePanel,
  StatusLamp,
} from "@repo/ui/arcade";
import { featureRegistry } from "../../../../configs/features";

const platformStatus = [
  ["Features", `${featureRegistry.list().length} REGISTERED`],
  ["Network", "UNSET"],
  ["Launches", "GATED"],
  ["Games", "01 PLANNED"],
] as const;

const platformNotices = [
  "★ BUILT ON BITCOIN",
  "◆ POWERED BY ALKANES",
  "▲ BETA FOUNDATION IN PROGRESS",
] as const;

const primaryNavigation = [
  { href: "#launches", label: "Launches" },
  { href: "#games", label: "Games", tone: "yellow" },
] as const;

export default function Home() {
  return (
    <AppShell
      brand="Adorbitals"
      footerLabel="Adorbitals beta foundation"
      homeHref="#top"
      navigation={primaryNavigation}
      notices={platformNotices}
    >
      <section className="arcade-hero">
        <div className="arcade-hero-copy">
          <StatusLamp label="Foundation build in progress" tone="attention" />
          <h1>Launch your legacy. Mint the future.</h1>
          <p>
            A self-custodial launchpad and game arcade for Bitcoin Alkanes.
            Transactional actions stay gated until their product decisions and
            end-to-end checks pass.
          </p>
          <div className="arcade-actions">
            <ArcadeButton href="#launches" tone="red">
              Explore launches
            </ArcadeButton>
            <ArcadeButton href="#games" tone="cyan">
              Enter arcade
            </ArcadeButton>
          </div>
        </div>

        <ArcadePanel eyebrow="System status" title="The Well">
          <dl className="arcade-score-grid">
            {platformStatus.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </ArcadePanel>
      </section>

      <section className="arcade-section" id="launches">
        <p className="arcade-eyebrow">01 / Launchpad</p>
        <h2>Fair launches without hidden controls.</h2>
        <p>
          No live sale is configured. Wallet, eligibility, transaction, and
          indexing flows will appear only after their release gates pass.
        </p>
      </section>

      <section className="arcade-section arcade-section--raised" id="games">
        <p className="arcade-eyebrow">02 / Arcade</p>
        <h2>One template. Many on-chain worlds.</h2>
        <article className="arcade-game-card">
          <span className="arcade-game-number">001</span>
          <div>
            <h3>Frostbite</h3>
            <p>First playable world · integration pending</p>
          </div>
          <span className="arcade-chip">COMING ONLINE</span>
        </article>
      </section>
    </AppShell>
  );
}

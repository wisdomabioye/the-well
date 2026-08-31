import { ArcadeButton, ArcadePanel, StatusLamp } from "@repo/ui/arcade";
import { featureRegistry } from "../../../../configs/features";

const platformStatus = [
  ["Features", `${featureRegistry.list().length} REGISTERED`],
  ["Network", "UNSET"],
  ["Launches", "GATED"],
  ["Games", "01 PLANNED"],
] as const;

export default function Home() {
  return (
    <main className="arcade-shell" id="top">
      <div className="arcade-marquee" aria-label="Platform status">
        <span>★ BUILT ON BITCOIN</span>
        <span>◆ POWERED BY ALKANES</span>
        <span>▲ BETA FOUNDATION IN PROGRESS</span>
      </div>

      <header className="arcade-header">
        <a className="arcade-brand" href="#top" aria-label="Adorbitals home">
          <span className="arcade-orbit" aria-hidden="true" />
          <span>ADORBITALS</span>
        </a>
        <nav aria-label="Primary navigation">
          <ArcadeButton href="#launches" tone="cyan">
            Launches
          </ArcadeButton>
          <ArcadeButton href="#games" tone="yellow">
            Games
          </ArcadeButton>
        </nav>
      </header>

      <section className="arcade-hero">
        <div className="arcade-hero-copy">
          <StatusLamp label="Foundation build in progress" />
          <h1>Launch your legacy. Mint the future.</h1>
          <p>
            A self-custodial launchpad and game arcade for Bitcoin Alkanes.
            Transactional actions stay gated until their product decisions and
            end-to-end checks pass.
          </p>
          <div className="arcade-actions">
            <ArcadeButton href="#launches" tone="magenta">
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

      <section className="arcade-section arcade-section-accent" id="games">
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
    </main>
  );
}

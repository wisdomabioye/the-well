import {
  AppShell,
  ArcadeButton,
  ArcadePanel,
  StatusLamp,
} from "@repo/ui/arcade";

import type { ProductCatalog } from "../domain/catalog.ts";

export function ProductIndex({
  catalog,
}: {
  readonly catalog: ProductCatalog;
}) {
  return (
    <AppShell
      brand="Adorbitals"
      footerLabel="Public discovery"
      homeHref="/"
      navigation={[{ href: catalog.path, label: catalog.label }]}
      notices={[
        "◆ VERIFIED PUBLIC RECORDS",
        "▲ TRUTHFUL SYSTEM STATE",
        "★ BITCOIN ALKANES",
      ]}
    >
      <section className="arcade-section arcade-section--catalog">
        <StatusLamp label="Catalog empty" tone="attention" />
        <ArcadePanel eyebrow="Public catalog" title={catalog.emptyTitle}>
          <p>{catalog.emptyBody}</p>
          <ArcadeButton href="/" tone="cyan">
            Return home
          </ArcadeButton>
        </ArcadePanel>
      </section>
    </AppShell>
  );
}

export function ProductDetailUnavailable({
  catalog,
  slug,
}: {
  readonly catalog: ProductCatalog;
  readonly slug: string | null;
}) {
  const valid = slug !== null;
  return (
    <AppShell
      brand="Adorbitals"
      footerLabel="Public discovery"
      homeHref="/"
      navigation={[{ href: catalog.path, label: catalog.label }]}
      notices={[
        "◆ VERIFIED PUBLIC RECORDS",
        "▲ FAIL CLOSED",
        "★ BITCOIN ALKANES",
      ]}
    >
      <section className="arcade-section arcade-section--catalog">
        <StatusLamp
          label={valid ? "Record not published" : "Invalid identifier"}
          tone="unavailable"
        />
        <ArcadePanel
          eyebrow={`${catalog.label} detail`}
          title={valid ? `${catalog.detailNoun} unavailable` : "Invalid route"}
        >
          <p>
            {valid
              ? `No published ${catalog.detailNoun} matches “${slug}”.`
              : `This ${catalog.detailNoun} identifier is not valid.`}
          </p>
          <ArcadeButton href={catalog.path} tone="cyan">
            Browse {catalog.label.toLowerCase()}
          </ArcadeButton>
        </ArcadePanel>
      </section>
    </AppShell>
  );
}

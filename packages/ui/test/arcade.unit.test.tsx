import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccessState, ArcadeButton, StatusLamp } from "../src/arcade.js";

describe("arcade controls", () => {
  it("renders an anchor with its requested tone and destination", () => {
    const markup = renderToStaticMarkup(
      <ArcadeButton href="#games" tone="cyan">
        Games
      </ArcadeButton>,
    );

    expect(markup).toContain('href="#games"');
    expect(markup).toContain("arcade-button--cyan");
    expect(markup).toContain("Games");
  });

  it("keeps the decorative lamp hidden from assistive technology", () => {
    const markup = renderToStaticMarkup(<StatusLamp label="Building" />);

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("status-lamp--attention");
    expect(markup).toContain("Building");
  });

  it.each([
    ["unauthenticated", "Authentication required"],
    ["forbidden", "Access denied"],
    ["unavailable", "Verification unavailable"],
  ] as const)("renders the %s protected-route state", (state, label) => {
    const markup = renderToStaticMarkup(<AccessState state={state} />);
    expect(markup).toContain(label);
    expect(markup).toContain("arcade-panel");
  });

  it("uses the protected route for an unavailable-state retry", () => {
    const markup = renderToStaticMarkup(
      <AccessState retryHref="/studio" state="unavailable" />,
    );

    expect(markup).toContain('href="/studio"');
  });
});

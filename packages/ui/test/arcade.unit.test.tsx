import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArcadeButton, StatusLamp } from "../src/arcade.js";

describe("arcade controls", () => {
  it("renders an anchor with its requested tone and destination", () => {
    const markup = renderToStaticMarkup(
      <ArcadeButton href="#games" tone="cyan">
        Games
      </ArcadeButton>,
    );

    expect(markup).toContain('href="#games"');
    expect(markup).toContain("arcade-button-cyan");
    expect(markup).toContain("Games");
  });

  it("keeps the decorative lamp hidden from assistive technology", () => {
    const markup = renderToStaticMarkup(<StatusLamp label="Building" />);

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("Building");
  });
});

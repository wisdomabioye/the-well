import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArcadeButton, ArcadePanel } from "../src/arcade.js";

describe("arcade panel composition", () => {
  it("preserves its heading and nested interactive content", () => {
    const markup = renderToStaticMarkup(
      <ArcadePanel eyebrow="System status" title="The Well">
        <ArcadeButton href="#launches" tone="yellow">
          Launches
        </ArcadeButton>
      </ArcadePanel>,
    );

    expect(markup).toContain("<article");
    expect(markup).toContain("<h2>The Well</h2>");
    expect(markup).toContain("arcade-button-yellow");
  });
});

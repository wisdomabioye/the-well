import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../src/app/page";

describe("home navigation", () => {
  it("connects navigation to visible launch and game sections", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain('href="#launches"');
    expect(markup).toContain('id="launches"');
    expect(markup).toContain('href="#games"');
    expect(markup).toContain('id="games"');
    expect(markup).toContain("Frostbite");
  });
});

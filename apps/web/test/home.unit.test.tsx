import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../src/app/page";

describe("home release state", () => {
  it("does not claim that unimplemented transactions are available", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("No live sale is configured");
    expect(markup).toContain("GATED");
    expect(markup).toContain("1 REGISTERED");
    expect(markup).not.toContain("Connect wallet");
    expect(markup).not.toContain("Buy now");
  });
});

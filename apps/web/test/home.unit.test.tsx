import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import FeaturePage from "../src/app/[[...path]]/page";

describe("home release state", () => {
  it("does not claim that unimplemented transactions are available", async () => {
    const page = await FeaturePage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("No live sale is configured");
    expect(markup).toContain("GATED");
    expect(markup).toContain("1 REGISTERED");
    expect(markup).not.toContain("Connect wallet");
    expect(markup).not.toContain("Buy now");
  });
});

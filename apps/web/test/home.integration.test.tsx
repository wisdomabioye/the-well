import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import FeaturePage from "../src/app/[[...path]]/page";

describe("home navigation", () => {
  it("connects navigation to visible launch and game sections", async () => {
    const page = await FeaturePage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('href="#launches"');
    expect(markup).toContain('id="launches"');
    expect(markup).toContain('href="#games"');
    expect(markup).toContain('id="games"');
    expect(markup).toContain("Frostbite");
  });

  it("rejects a page path that no registered feature owns", async () => {
    await expect(
      FeaturePage({
        params: Promise.resolve({ path: ["missing"] }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});

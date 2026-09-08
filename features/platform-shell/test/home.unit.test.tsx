import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createPlatformShellEntrypoint } from "../src/entrypoint.js";
import { PlatformHome } from "../src/ui/home.js";

describe("PlatformHome", () => {
  it("renders truthful status and the injected feature count", async () => {
    const markup = renderToStaticMarkup(
      <PlatformHome registeredFeatures={3} />,
    );
    expect(markup).toContain("3 REGISTERED");
    expect(markup).toContain("No live sale is configured");
    expect(markup).not.toContain("Connect wallet");

    const [page] =
      createPlatformShellEntrypoint({
        registeredFeatureCount: 3,
      }).pages ?? [];
    expect(page?.path).toBe("/");
    expect(renderToStaticMarkup(await page?.render())).toContain(
      "3 REGISTERED",
    );
  });
});

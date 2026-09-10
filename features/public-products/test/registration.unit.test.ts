import { describe, expect, it } from "vitest";

import {
  collectionsFeature,
  creatorsFeature,
  gamesFeature,
  launchesFeature,
} from "../src/registration.ts";

describe("publicProductsFeature", () => {
  it("declares independently detachable domain route families", () => {
    const features = [
      launchesFeature,
      collectionsFeature,
      creatorsFeature,
      gamesFeature,
    ];
    expect(features.map(({ manifest }) => manifest.id)).toEqual([
      "launches",
      "collections",
      "creators",
      "games",
    ]);
    for (const { manifest } of features) {
      expect(manifest.pages).toHaveLength(2);
      expect(manifest.pages[1]?.path).toBe(`${manifest.pages[0]?.path}/[slug]`);
      expect(manifest.requiredProviderCapabilities).toEqual([]);
    }
  });
});

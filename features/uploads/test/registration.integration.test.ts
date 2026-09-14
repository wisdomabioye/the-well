import { createProviderRegistry } from "@ador/plugin-kit/providers";
import { describe, expect, it } from "vitest";

import { createUploadsFeature } from "../src/registration.ts";

describe("uploads feature registration", () => {
  it("declares one detachable route and its provider capability", async () => {
    const feature = createUploadsFeature(createProviderRegistry([]));
    expect(feature.manifest).toMatchObject({
      id: "uploads",
      requiredProviderCapabilities: ["object-storage:s3-compatible"],
      routes: [
        {
          method: "POST",
          operationId: "createUploadIntent",
          path: "/api/v1/uploads/intents",
        },
      ],
    });
    await expect(
      feature.load({
        registeredFeatureCount: 1,
        registeredFeatureIds: ["uploads"],
      }),
    ).resolves.toMatchObject({ id: "uploads" });
  });
});

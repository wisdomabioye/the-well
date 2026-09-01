import { describe, expect, it } from "vitest";

import { platformShellFeature } from "../src/registration.js";

describe("platform shell manifest", () => {
  it("declares only the capabilities currently implemented", () => {
    expect(platformShellFeature.manifest).toEqual({
      id: "platform-shell",
      version: "1.0.0",
      capabilities: ["api-routes", "navigation", "public-page"],
      dependencies: [],
      requiredProviderCapabilities: [],
      routes: [
        {
          method: "GET",
          operationId: "getOpenApiDocument",
          path: "/api/v1/openapi",
        },
        {
          method: "GET",
          operationId: "getPlatformStatus",
          path: "/api/v1/platform",
        },
      ],
    });
  });
});

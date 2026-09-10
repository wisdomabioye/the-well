import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "session-token" }) }),
}));

vi.mock("../src/server/auth/runtime", () => ({
  getPageAccessDependencies: () => ({
    findSession: async () => ({
      absoluteExpiresAt: new Date("2026-09-10T00:00:00.000Z"),
      authenticatedAt: new Date("2026-09-09T00:00:00.000Z"),
      idleExpiresAt: new Date("2026-09-09T12:00:00.000Z"),
      sessionId: "01992bd8-a740-7000-8000-000000000001",
      userId: "01992bd8-a740-7000-8000-000000000002",
    }),
    forPlatform: async () => ({ allowed: true, policyVersion: "test-v1" }),
  }),
}));

import FeaturePage from "../src/app/[[...path]]/page";

describe("authorized protected page delivery", () => {
  it.each([
    ["account", "Account console"],
    ["admin", "Admin console"],
  ])("renders the authorized /%s contribution", async (path, heading) => {
    const page = await FeaturePage({
      params: Promise.resolve({ path: [path] }),
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(page);
    expect(markup).toContain(heading);
    expect(markup).toContain("01992bd8-a740-7000-8000-000000000002");
  });
});

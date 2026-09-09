import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import FeaturePage from "../src/app/[[...path]]/page";

describe("protected page delivery", () => {
  it.each(["account", "studio", "admin"])(
    "fails closed for a cookieless /%s request",
    async (path) => {
      const page = await FeaturePage({
        params: Promise.resolve({ path: [path] }),
        searchParams: Promise.resolve({}),
      });
      const markup = renderToStaticMarkup(page);
      expect(markup).toContain("Authentication required");
      expect(markup).not.toContain("Session active");
      expect(markup).not.toContain("Staff capability verified");
    },
  );
});

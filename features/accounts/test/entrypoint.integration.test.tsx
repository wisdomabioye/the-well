import { createUuidV7 } from "@ador/shared/identifiers";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createAccountsEntrypoint } from "../src/entrypoint.tsx";

describe("accounts entrypoint", () => {
  it.each([
    ["/account", "Account console", "Authenticated session"],
    ["/studio", "Creator studio", "Authenticated access"],
    ["/admin", "Admin console", "Staff capability verified"],
  ])("renders the authorized %s surface", async (path, title, status) => {
    const entrypoint = createAccountsEntrypoint();
    const page = entrypoint.pages?.find((candidate) => candidate.path === path);
    expect(page).toBeDefined();
    const markup = renderToStaticMarkup(
      await page?.render({ actorUserId: createUuidV7(), params: {} }),
    );
    expect(markup).toContain(title);
    expect(markup).toContain(status);
  });

  it("does not render private content without an actor", async () => {
    const pages = createAccountsEntrypoint().pages ?? [];

    for (const page of pages) {
      expect(
        renderToStaticMarkup(
          await page.render({ actorUserId: null, params: {} }),
        ),
      ).toBe("");
    }
  });
});

import { expect, test } from "@playwright/test";

test("shows only honest foundation-stage launchpad controls", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /launch your legacy/i }),
  ).toBeVisible();
  await expect(page.getByText("No live sale is configured")).toBeVisible();
  await expect(page.getByRole("link", { name: /connect wallet/i })).toHaveCount(
    0,
  );
});

test("serves the arcade design stylesheet in the production build", async ({
  page,
}) => {
  const stylesheetStatuses: number[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "stylesheet") {
      stylesheetStatuses.push(response.status());
    }
  });

  await page.goto("/");

  await expect(page.locator("body")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
  expect(stylesheetStatuses).not.toContain(404);
});

test("navigates to the planned game from the primary control", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Enter arcade" }).click();

  await expect(page).toHaveURL(/#games$/);
  await expect(page.getByRole("heading", { name: "Frostbite" })).toBeVisible();
});

test("serves the versioned platform contract with correlated truthful state", async ({
  request,
}) => {
  const correlationId = "123e4567-e89b-42d3-a456-426614174000";
  const response = await request.get("/api/v1/platform", {
    headers: { "x-correlation-id": correlationId },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["x-correlation-id"]).toBe(correlationId);
  expect(await response.json()).toEqual({
    apiVersion: "v1",
    registeredFeatures: 1,
    stage: "foundation",
    transactionalActions: "gated",
  });
});

test("serves a generated domain-independent OpenAPI contract", async ({
  request,
}) => {
  const response = await request.get("/api/v1/openapi");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    openapi: "3.1.0",
    paths: {
      "/api/v1/platform": {
        get: { operationId: "getPlatformStatus" },
      },
    },
  });
  expect(JSON.stringify(await response.json())).not.toContain('"servers"');
});

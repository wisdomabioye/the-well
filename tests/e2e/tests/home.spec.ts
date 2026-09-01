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

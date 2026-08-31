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

test("navigates to the planned game from the primary control", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Enter arcade" }).click();

  await expect(page).toHaveURL(/#games$/);
  await expect(page.getByRole("heading", { name: "Frostbite" })).toBeVisible();
});

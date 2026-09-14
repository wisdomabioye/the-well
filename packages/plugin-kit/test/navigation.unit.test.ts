import { describe, expect, it, vi } from "vitest";

import { navigationForAudience, navigationForUser } from "../src/navigation.ts";

const navigation = [
  { access: { kind: "public" }, href: "/launches", label: "Launches" },
  { access: { kind: "authenticated" }, href: "/studio", label: "Studio" },
  {
    access: { capability: "platform:operate", kind: "platform" },
    href: "/admin",
    label: "Admin",
  },
  {
    access: { capability: "creator:review", kind: "platform" },
    href: "/admin/creator-applications",
    label: "Creator reviews",
  },
] as const;

describe("manifest navigation", () => {
  it("reveals only links appropriate for an anonymous audience", () => {
    const items = navigationForAudience(navigation, "public");
    expect(items).toEqual([{ href: "/launches", label: "Launches" }]);
    expect(Reflect.set(items, "0", null)).toBe(false);
    expect(Reflect.set(items[0] ?? {}, "label", "Changed")).toBe(false);
  });

  it("adds authenticated links without exposing platform links", () => {
    expect(navigationForAudience(navigation, "authenticated")).toEqual([
      { href: "/launches", label: "Launches" },
      { href: "/studio", label: "Studio" },
    ]);
  });

  it("includes only platform links authorized for the exact user", async () => {
    const isAllowed = vi.fn(
      async (capability: string) => capability === "creator:review",
    );
    const items = await navigationForUser(navigation, isAllowed);
    expect(items).toEqual([
      { href: "/launches", label: "Launches" },
      { href: "/studio", label: "Studio" },
      { href: "/admin/creator-applications", label: "Creator reviews" },
    ]);
    expect(Reflect.set(items, "0", null)).toBe(false);
    expect(Reflect.set(items[0] ?? {}, "label", "Changed")).toBe(false);
    expect(isAllowed).toHaveBeenCalledTimes(2);
  });

  it("fails closed when a capability provider is unavailable", async () => {
    await expect(
      navigationForUser(navigation, async () => {
        throw new Error("authorization unavailable");
      }),
    ).resolves.toEqual([
      { href: "/launches", label: "Launches" },
      { href: "/studio", label: "Studio" },
    ]);
  });
});

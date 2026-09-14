import type {
  NavigationContribution,
  PageAccessRequirement,
} from "@ador/shared/features";

export type NavigationAudience = Exclude<
  PageAccessRequirement["kind"],
  "platform"
>;

export interface NavigationItem {
  readonly href: string;
  readonly label: string;
}

const audienceRank = {
  authenticated: 1,
  platform: 2,
  public: 0,
} as const satisfies Readonly<Record<PageAccessRequirement["kind"], number>>;

export function navigationForAudience(
  contributions: readonly NavigationContribution[],
  audience: NavigationAudience,
): readonly NavigationItem[] {
  const maximumRank = audienceRank[audience];
  return Object.freeze(
    contributions
      .filter(({ access }) => audienceRank[access.kind] <= maximumRank)
      .map(({ href, label }) => Object.freeze({ href, label })),
  );
}

export async function navigationForUser(
  contributions: readonly NavigationContribution[],
  isAllowed: (capability: string) => Promise<boolean>,
): Promise<readonly NavigationItem[]> {
  const items = await Promise.all(
    contributions.map(async ({ access, href, label }) => {
      if (access.kind !== "platform") {
        return Object.freeze({ href, label });
      }
      try {
        if (await isAllowed(access.capability)) {
          return Object.freeze({ href, label });
        }
      } catch {
        // Navigation is convenience, never authorization. Provider failures fail closed.
      }
      return null;
    }),
  );
  return Object.freeze(
    items.filter((item): item is NavigationItem => item !== null),
  );
}

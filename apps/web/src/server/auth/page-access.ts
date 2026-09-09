import type { ActiveSession } from "@ador/auth";
import type { AuthorizationDecision } from "@ador/authorization";
import type { PageAccessRequirement } from "@ador/shared/features";
import type { UuidV7 } from "@ador/shared/identifiers";

type ProtectedPageAccessRequirement = Exclude<
  PageAccessRequirement,
  { readonly kind: "public" }
>;

export type PageAccessDecision =
  | { readonly actorUserId: UuidV7; readonly kind: "allowed" }
  | { readonly kind: "forbidden" }
  | { readonly kind: "unauthenticated" }
  | { readonly kind: "unavailable" };

export interface PageAccessDependencies {
  readonly findSession: (token: string) => Promise<ActiveSession | null>;
  readonly forPlatform: (input: {
    readonly capability: string;
    readonly userId: UuidV7;
  }) => Promise<AuthorizationDecision>;
}

export async function resolvePageAccess(
  requirement: ProtectedPageAccessRequirement,
  token: string | undefined,
  getDependencies: () => PageAccessDependencies,
): Promise<PageAccessDecision> {
  if (token === undefined || token.length === 0)
    return { kind: "unauthenticated" };
  try {
    const dependencies = getDependencies();
    const session = await dependencies.findSession(token);
    if (session === null) return { kind: "unauthenticated" };
    if (requirement.kind === "authenticated") {
      return { actorUserId: session.userId, kind: "allowed" };
    }
    const authorization = await dependencies.forPlatform({
      capability: requirement.capability,
      userId: session.userId,
    });
    return authorization.allowed
      ? { actorUserId: session.userId, kind: "allowed" }
      : { kind: "forbidden" };
  } catch {
    return { kind: "unavailable" };
  }
}

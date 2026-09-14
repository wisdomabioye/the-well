import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { platformSessionCookieName } from "@ador/shared/auth";
import { AccessState } from "@repo/ui/arcade";
import {
  navigationForAudience,
  navigationForUser,
} from "@ador/plugin-kit/navigation";

import { platformComposition } from "../../../../../configs/platform";
import { resolvePageAccess } from "../../server/auth/page-access";
import { getPageAccessDependencies } from "../../server/auth/runtime";

export default async function FeaturePage({
  params,
}: PageProps<"/[[...path]]">) {
  const { path = [] } = await params;
  const routePath = `/${path.join("/")}`;
  const match = await platformComposition.features.resolvePage(routePath);
  if (!match) notFound();
  const { page: contribution, params: routeParams } = match;
  const navigationContributions = platformComposition.features.listNavigation();
  const publicNavigation = navigationForAudience(
    navigationContributions,
    "public",
  );
  if (contribution.access.kind === "public") {
    return contribution.render({
      actorUserId: null,
      navigation: publicNavigation,
      params: routeParams,
    });
  }
  const token = (await cookies()).get(platformSessionCookieName)?.value;
  const access = await resolvePageAccess(
    contribution.access,
    token,
    getPageAccessDependencies,
  );
  if (access.kind !== "allowed") {
    return (
      <AccessState
        navigation={publicNavigation}
        retryHref={routePath}
        state={access.kind}
      />
    );
  }
  const navigation = await navigationForUser(
    navigationContributions,
    async (capability) => {
      const decision = await getPageAccessDependencies().forPlatform({
        capability,
        userId: access.actorUserId,
      });
      return decision.allowed;
    },
  );
  return contribution.render({
    actorUserId: access.actorUserId,
    navigation,
    params: routeParams,
  });
}

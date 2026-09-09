import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { platformSessionCookieName } from "@ador/shared/auth";
import { AccessState } from "@repo/ui/arcade";

import { platformComposition } from "../../../../../configs/platform";
import { resolvePageAccess } from "../../server/auth/page-access";
import { getPageAccessDependencies } from "../../server/auth/runtime";

export default async function FeaturePage({
  params,
}: PageProps<"/[[...path]]">) {
  const { path = [] } = await params;
  const routePath = `/${path.join("/")}`;
  const contribution =
    await platformComposition.features.resolvePage(routePath);
  if (!contribution) notFound();
  if (contribution.access.kind === "public") {
    return contribution.render({ actorUserId: null });
  }
  const token = (await cookies()).get(platformSessionCookieName)?.value;
  const access = await resolvePageAccess(
    contribution.access,
    token,
    getPageAccessDependencies,
  );
  if (access.kind !== "allowed") {
    return <AccessState retryHref={routePath} state={access.kind} />;
  }
  return contribution.render({ actorUserId: access.actorUserId });
}

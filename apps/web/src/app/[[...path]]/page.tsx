import { notFound } from "next/navigation";

import { platformComposition } from "../../../../../configs/platform";

export default async function FeaturePage({
  params,
}: PageProps<"/[[...path]]">) {
  const { path = [] } = await params;
  const contribution = await platformComposition.features.resolvePage(
    `/${path.join("/")}`,
  );
  if (!contribution) notFound();
  return contribution.render();
}

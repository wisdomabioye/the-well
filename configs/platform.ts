import { validatePlatformBoot } from "@ador/plugin-kit/boot";

import { decisionCatalog } from "./decision-gates";
import { featureRegistry } from "./features";
import { providerRegistry } from "./providers";

const platformBoot = validatePlatformBoot({
  decisionCatalog,
  featureRegistry,
  providerRegistry,
});

export const platformComposition = Object.freeze({
  boot: platformBoot,
  features: featureRegistry,
  providers: providerRegistry,
});

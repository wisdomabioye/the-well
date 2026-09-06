import { validatePlatformBoot } from "@ador/plugin-kit/boot";

import { decisionCatalog } from "./decision-gates";
import { featureRegistry } from "./features";
import { providerRegistry } from "./providers";

export const platformBoot = validatePlatformBoot({
  decisionCatalog,
  featureRegistry,
  providerRegistry,
});

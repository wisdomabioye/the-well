import { validatePlatformBoot } from "@ador/plugin-kit/boot";

import { featureRegistry } from "./features";
import { providerRegistry } from "./providers";

export const platformBoot = validatePlatformBoot({
  featureRegistry,
  providerRegistry,
});

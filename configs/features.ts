import { accountsFeature } from "@ador/feature-accounts";
import { creatorAdmissionFeature } from "@ador/feature-creator-admission";
import { platformShellFeature } from "@ador/feature-platform-shell";
import { createFeatureRegistry } from "@ador/plugin-kit";

export const featureRegistry = createFeatureRegistry([
  platformShellFeature,
  accountsFeature,
  creatorAdmissionFeature,
]);

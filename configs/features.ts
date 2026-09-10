import { accountsFeature } from "@ador/feature-accounts";
import { creatorAdmissionFeature } from "@ador/feature-creator-admission";
import { platformShellFeature } from "@ador/feature-platform-shell";
import {
  collectionsFeature,
  creatorsFeature,
  gamesFeature,
  launchesFeature,
} from "@ador/feature-public-products";
import { createFeatureRegistry } from "@ador/plugin-kit";

export const featureRegistry = createFeatureRegistry([
  platformShellFeature,
  accountsFeature,
  creatorAdmissionFeature,
  launchesFeature,
  collectionsFeature,
  creatorsFeature,
  gamesFeature,
]);

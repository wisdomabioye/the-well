import { createPlatformStatusOperation } from "@ador/feature-platform-shell/status";
import {
  createOpenApiDocument,
  describeOpenApiOperation,
} from "@ador/http/openapi";
import { platformApiInfo } from "@ador/shared/platform";

import { platformBoot } from "./platform";

export const platformStatusOperation = createPlatformStatusOperation(
  platformBoot.features.length,
);

export const openApiDocument = createOpenApiDocument({
  ...platformApiInfo,
  operations: [describeOpenApiOperation(platformStatusOperation)],
});

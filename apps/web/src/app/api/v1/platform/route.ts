import { createPlatformStatusOperation } from "@ador/feature-platform-shell/status";

import { featureRegistry } from "../../../../../../../configs/features";
import { executeNextOperation } from "../../../../server/http/next-operation";

export const runtime = "nodejs";

const operation = createPlatformStatusOperation(featureRegistry.list().length);

export function GET(request: Request) {
  return executeNextOperation(operation, request, {});
}

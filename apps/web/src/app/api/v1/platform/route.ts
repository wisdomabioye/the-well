import { platformStatusOperation } from "../../../../../../../configs/api";
import { executeNextOperation } from "../../../../server/http/next-operation";

export const runtime = "nodejs";

function handle(request: Request) {
  return executeNextOperation(platformStatusOperation, request, {});
}

export {
  handle as DELETE,
  handle as GET,
  handle as PATCH,
  handle as POST,
  handle as PUT,
};

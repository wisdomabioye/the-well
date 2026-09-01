import { openApiDocument } from "../../../../../../../configs/api";

export const runtime = "nodejs";

export function GET() {
  return Response.json(openApiDocument);
}

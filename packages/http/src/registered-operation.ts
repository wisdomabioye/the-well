import type { RouteContribution } from "@ador/shared/features";

import {
  executeHttpOperation,
  type HttpAdapterRequest,
  type HttpAdapterResponse,
  type HttpExecutionDependencies,
  type HttpOperation,
} from "./operation.ts";
import { describeOpenApiOperation } from "./openapi.ts";

export type OpenApiOperationDescription = ReturnType<
  typeof describeOpenApiOperation
>;

export interface RegisteredHttpOperation {
  readonly describe: () => OpenApiOperationDescription;
  readonly execute: (
    request: HttpAdapterRequest,
    dependencies: HttpExecutionDependencies,
  ) => Promise<HttpAdapterResponse<object>>;
  readonly route: RouteContribution;
}

export function registerHttpOperation<Input, Output extends object>(
  operation: HttpOperation<Input, Output>,
): RegisteredHttpOperation {
  return Object.freeze({
    describe: () => describeOpenApiOperation(operation),
    execute: (
      request: HttpAdapterRequest,
      dependencies: HttpExecutionDependencies,
    ) => executeHttpOperation(operation, request, dependencies),
    route: Object.freeze({
      method: operation.method,
      operationId: operation.operationId,
      path: operation.path,
    }),
  });
}

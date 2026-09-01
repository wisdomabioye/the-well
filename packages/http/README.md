# `@ador/http`

Framework-neutral execution boundary for versioned HTTP operations.

Operations declare method, path, idempotency policy, runtime input/output schemas, and one typed
application handler. Delivery adapters supply untrusted input, selected normalized headers, and a
correlation-ID generator. The executor validates every boundary and emits the shared safe error
envelope without importing Next.js or Fastify.

The package owns no business logic, authentication policy, database access, or provider calls.
Adapters and feature operations are verified independently through conformance tests.

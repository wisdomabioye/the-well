# `@ador/events`

Provider-neutral, versioned domain-event envelopes used by transactional outbox delivery.

Payloads contain non-empty identifier references only; secrets, signed URLs, complete records, and
large artifacts are prohibited. Event identity is stable across delivery retries and audited
replay. This package owns no database, workflow-provider, framework, or feature logic.

Run `typecheck`, `test:unit`, `test:integration`, and `test:coverage` from this workspace.

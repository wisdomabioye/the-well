# D15 authenticated prevout capability — task record

Status: specification complete; external upstream implementation remains blocked  
Baseline: `64f21381f7bdfe4a950980ccf6c344e1cb999618`  
Date: 2026-09-07

## Scope and result

Assessed whether the pinned Alkanes runtime can expose authoritative previous outputs without trusting
claim calldata. The feasible boundary is a complete ordered prevout-set host call derived exclusively
from the executing transaction. The implementation specification, invariants, source ownership,
negative cases, mutation requirements, and provider rollout gate are recorded in
`references/authenticated-prevout-capability.md`.

The pinned runtime does not expose this capability. No launchpad production code, feature flag, or
false-positive compatibility status was added. D15 remains researching and dependent launchpad gates
remain closed.

## Evidence inspected

- Pinned `alkanes-runtime` guest imports and responder API.
- Nested `wasmi` host functions and linker registrations.
- `MessageContextParcel` and `AlkanesRuntimeContext` transaction context.
- Protorune output indexing, output table, height/transaction-index tables, and block execution order.
- Current official Alkanes and Metashrew repositories/specification.

## Verification

The artifact is documentation-only. Every described source relationship was checked against the
pinned revision, and the proposed API accepts no claimant-controlled prevout data. Existing contract
gates were rerun to detect incidental repository drift; final audit evidence is recorded in the task
handoff.

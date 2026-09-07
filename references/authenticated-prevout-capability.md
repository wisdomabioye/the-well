# D15 authenticated input-prevout capability

Status: upstream capability specification; implementation outside this repository is required  
Pinned evidence revision: `alkanes-rs@62511e9371a3f9e448841140c51cfe428cfcb955`  
Date: 2026-09-07

## Outcome

The smallest viable upstream capability is a read-only host call that returns the complete,
transaction-input-ordered `Vec<TxOut>` for the transaction currently executing an Alkane message.
It must not accept an outpoint, script, amount, transaction, or claimed wallet from contract
calldata. The current transaction is already supplied by the runtime; the host derives every lookup
key from that transaction itself.

This capability is feasible in the pinned architecture, but it is not present today. D15 therefore
remains gated until an upstream revision implements and tests it and the supported indexers expose
that exact revision.

## Existing authoritative path

The pinned source already establishes most of the data path:

1. `Protorune::index_block` calls `index_transaction_ids` and `index_outpoints` before
   `index_unspendables`, where Alkane messages execute.
2. `index_outpoints` writes every `TxOut` into `OUTPOINT_TO_OUTPUT`, keyed by the consensus encoding
   of its `OutPoint`. It also records the output height.
3. `MessageContextParcel` carries the current transaction, block, height, and transaction index into
   `AlkanesRuntimeContext`.
4. `alkanes-runtime` exposes the current transaction to contracts.
5. Output-request/load implementations and VM linker registrations exist but are commented out.

Production authority comes from the Bitcoin blocks accepted by the node feeding Metashrew. The
in-memory harness does not validate Bitcoin consensus, so its fixtures must explicitly construct
valid ordering and missing-output cases. A host call cannot turn an invalid fabricated block into
authoritative evidence.

## Required API contract

Guest API:

```text
AlkaneResponder::input_prevouts() -> Result<Vec<TxOut>, PrevoutError>
```

Host ABI:

```text
env.__request_input_prevouts() -> i32
env.__load_input_prevouts(output_ptr: i32) -> i32
```

The payload is Bitcoin consensus encoding of `Vec<TxOut>`. The order and length must exactly match
`current_transaction.input`. Returning the whole set in one snapshot avoids per-input disagreement,
supports Taproot `Prevouts::All`, and removes arbitrary historical-output access from the contract
surface.

Host behavior must be:

- Derive each outpoint only from the current transaction's inputs.
- Reject coinbase inputs for claim execution.
- Fail atomically if any output is absent, malformed, duplicated inconsistently, or cannot be
  represented as a Bitcoin `TxOut`; never return a partial vector.
- For same-block inputs, prove the producing transaction index is lower than the current transaction
  index. Reject forward references even when a fabricated test block pre-populated the output table.
- Charge deterministic fuel for lookup keys and returned bytes, with checked arithmetic and a
  configured maximum input count/response size.
- Return distinguishable errors for unavailable capability, missing output, invalid ordering,
  malformed stored output, resource limit, and host failure.
- Leave storage unchanged. A failed lookup or later contract revert must not affect claim state.

Guest behavior must decode with full-consumption semantics, reject a length mismatch, and return
concrete `TxOut` values. It must not fall back to calldata, an RPC provider, an address string, or a
recipient output.

## Source changes required upstream

The implementation spans these owned boundaries in `alkanes-rs`:

- `crates/alkanes-runtime/src/imports.rs`: declare the two host imports and deterministic test-host
  stubs that can inject an ordered prevout set.
- `crates/alkanes-runtime/src/runtime.rs`: add the typed `input_prevouts()` guest method and strict
  decoding/count validation. Do not revive the arbitrary `output(&OutPoint)` API.
- `src/vm/host_functions.rs`: resolve the complete ordered set from the current transaction and
  `protorune::tables::OUTPOINT_TO_OUTPUT`; enforce presence, same-block ordering, limits, and fuel.
- `src/vm/instance.rs`: register both imports and abort execution on host errors without returning
  ambiguous empty bytes.
- Runtime/indexer tests: exercise the production WASM path with prior-block and earlier-same-block
  spends, plus every failure listed below.

No new Metashrew global host function is required: these imports belong to the nested Alkane `wasmi`
runtime, whose context already owns the current transaction and indexed atomic pointer.

## Mandatory upstream tests

- One-input and multi-input vectors preserve exact input order and values.
- P2WPKH verification changes outcome when the selected prevout amount or script changes.
- P2TR `SIGHASH_DEFAULT` and `SIGHASH_ALL` use the complete returned set; reordering fails.
- A prior-block output and an earlier-same-block output resolve successfully.
- Missing outpoint, out-of-range vout, malformed stored protobuf, coinbase input, same-block forward
  reference, excessive input count, excessive response bytes, and fuel exhaustion all revert.
- Request/load size disagreement cannot expose uninitialized or truncated memory.
- Nested call, delegate call, and static call observe the originating transaction prevouts rather
  than a callee-selected transaction.
- Contract writes before a later failure roll back; successful writes follow normal indexed-state
  reorg rollback.
- Old contracts that do not import the capability remain byte-for-byte behaviorally unchanged.
- Indexer conformance compares every supported provider on identical blocks before launchpad use.

Tests must include deliberate mutations: reverse the host result, substitute one satoshi, permit a
missing output, permit a forward reference, and move a write before a failing lookup. Each mutation
must make a relevant test fail.

## Deployment and compatibility gate

Adding optional host imports does not change old contract execution, but a contract importing them
cannot instantiate on an older indexer. The launchpad must therefore bind the allowlist contract
template to a minimum capability/version and refuse deployment when the configured provider does not
advertise and pass conformance for it.

Acceptance requires:

1. An immutable upstream revision and reproducible runtime/contract artifacts.
2. Passing upstream production-path tests and mutation evidence.
3. SUBFROST plus every enabled fallback indexer returning identical results.
4. LaserEyes P2WPKH and P2TR signed flows validated against the returned prevouts.
5. A deployable contract within the measured Alkanes code-size and fuel budgets.

Until all five hold, the launchpad must keep allowlist publication and production contract deployment
gated. There is no recipient-only, calldata-prevout, or platform-asserted fallback.

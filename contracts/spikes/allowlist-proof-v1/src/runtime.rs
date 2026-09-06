use alkanes_runtime::runtime::AlkaneResponder;
use bitcoin::TxOut;

use crate::{verify_claimant_authorization, AuthorizationError, ClaimantScriptType};

struct RuntimeTransactionSource;

impl AlkaneResponder for RuntimeTransactionSource {}

/// Verifies the transaction bytes supplied by the Alkanes host. Prevouts must
/// be independently resolved for simulation; confirmed execution relies on
/// Bitcoin consensus having validated them against the current transaction.
pub fn verify_runtime_claimant_authorization(
    input_index: usize,
    prevouts: &[TxOut],
) -> Result<ClaimantScriptType, AuthorizationError> {
    verify_claimant_authorization(
        &RuntimeTransactionSource.transaction(),
        input_index,
        prevouts,
    )
}

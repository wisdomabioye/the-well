use allowlist_proof_v1_spike::{verify_claimant_authorization, AuthorizationError};
use bitcoin::consensus::serialize;
use bitcoin::{PublicKey, ScriptBuf, Witness};

mod support;
use support::{p2tr_explicit_all_fixture, p2tr_fixture, p2wpkh_fixture, CLAIMANT_INPUT_INDEX};

fn verify_error(
    transaction: &bitcoin::Transaction,
    prevout: &bitcoin::TxOut,
) -> AuthorizationError {
    verify_claimant_authorization(
        &serialize(transaction),
        CLAIMANT_INPUT_INDEX,
        std::slice::from_ref(prevout),
    )
    .expect_err("malformed authorization must fail")
}

#[test]
fn rejects_malformed_p2wpkh_signature_encodings() {
    let (mut transaction, prevout) = p2wpkh_fixture();
    transaction.input[CLAIMANT_INPUT_INDEX].witness =
        Witness::from_slice(&[vec![0, 1], transaction.input[0].witness[1].to_vec()]);
    assert_eq!(
        verify_error(&transaction, &prevout),
        AuthorizationError::InvalidSignature
    );

    let (mut transaction, prevout) = p2wpkh_fixture();
    let public_key = PublicKey::from_slice(&transaction.input[0].witness[1])
        .expect("fixture public key must parse");
    transaction.input[CLAIMANT_INPUT_INDEX].witness = Witness::from_slice(&[
        transaction.input[0].witness[0].to_vec(),
        public_key.inner.serialize_uncompressed().to_vec(),
    ]);
    assert_eq!(
        verify_error(&transaction, &prevout),
        AuthorizationError::InvalidPublicKey
    );
}

#[test]
fn rejects_malformed_p2tr_signature_and_public_key() {
    let (mut transaction, prevout) = p2tr_fixture();
    transaction.input[CLAIMANT_INPUT_INDEX].witness = Witness::from_slice(&[vec![0, 1]]);
    assert_eq!(
        verify_error(&transaction, &prevout),
        AuthorizationError::InvalidSignature
    );

    let (transaction, mut prevout) = p2tr_explicit_all_fixture();
    let mut script = prevout.script_pubkey.as_bytes().to_vec();
    script[2..].fill(0xff);
    prevout.script_pubkey = ScriptBuf::from_bytes(script);
    assert_eq!(
        verify_error(&transaction, &prevout),
        AuthorizationError::InvalidPublicKey
    );
}

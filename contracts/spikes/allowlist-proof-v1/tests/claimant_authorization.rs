use allowlist_proof_v1_spike::{
    verify_claimant_authorization, AuthorizationError, ClaimantScriptType,
};
use bitcoin::consensus::serialize;
use bitcoin::hashes::Hash;
use bitcoin::script::Builder;
use bitcoin::sighash::{EcdsaSighashType, TapSighashType};
use bitcoin::{Amount, ScriptBuf, Witness};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::wasm_bindgen_test;

mod support;
use support::{
    p2tr_explicit_all_fixture, p2tr_fixture, p2wpkh_fixture, CLAIMANT_INPUT_INDEX, PREVOUT_SATS,
    RECIPIENT_SATS,
};

const P2TR_EXPLICIT_ALL_FIXTURE_WEIGHT: u64 = 569;
const P2TR_FIXTURE_WEIGHT: u64 = 568;
const P2WPKH_FIXTURE_WEIGHT: u64 = 609;

#[cfg_attr(not(target_arch = "wasm32"), test)]
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
fn accepts_exact_p2wpkh_and_p2tr_claim_actions() {
    let (p2wpkh_transaction, p2wpkh_prevout) = p2wpkh_fixture();
    assert_eq!(p2wpkh_transaction.weight().to_wu(), P2WPKH_FIXTURE_WEIGHT);
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&p2wpkh_transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&p2wpkh_prevout),
        ),
        Ok(ClaimantScriptType::P2wpkh)
    );

    let (p2tr_transaction, p2tr_prevout) = p2tr_fixture();
    assert_eq!(p2tr_transaction.weight().to_wu(), P2TR_FIXTURE_WEIGHT);
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&p2tr_transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&p2tr_prevout),
        ),
        Ok(ClaimantScriptType::P2tr)
    );

    let (explicit_all, prevout) = p2tr_explicit_all_fixture();
    assert_eq!(
        explicit_all.weight().to_wu(),
        P2TR_EXPLICIT_ALL_FIXTURE_WEIGHT
    );
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&explicit_all),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Ok(ClaimantScriptType::P2tr)
    );
}

#[cfg_attr(not(target_arch = "wasm32"), test)]
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
fn rejects_modified_actions_wrong_claimants_and_replays() {
    for (transaction, prevout) in [p2wpkh_fixture(), p2tr_fixture()] {
        let mut modified_action = transaction.clone();
        modified_action.output[0].value = Amount::from_sat(RECIPIENT_SATS - 1);
        assert_eq!(
            verify_claimant_authorization(
                &serialize(&modified_action),
                CLAIMANT_INPUT_INDEX,
                std::slice::from_ref(&prevout),
            ),
            Err(AuthorizationError::InvalidSignature)
        );

        let mut wrong_prevout = prevout.clone();
        wrong_prevout.value = Amount::from_sat(PREVOUT_SATS - 1);
        assert_eq!(
            verify_claimant_authorization(
                &serialize(&transaction),
                CLAIMANT_INPUT_INDEX,
                std::slice::from_ref(&wrong_prevout),
            ),
            Err(AuthorizationError::InvalidSignature)
        );

        let mut replay = transaction.clone();
        replay.input[CLAIMANT_INPUT_INDEX].previous_output.vout += 1;
        assert_eq!(
            verify_claimant_authorization(
                &serialize(&replay),
                CLAIMANT_INPUT_INDEX,
                std::slice::from_ref(&prevout),
            ),
            Err(AuthorizationError::InvalidSignature)
        );
    }
}

#[cfg_attr(not(target_arch = "wasm32"), test)]
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
fn rejects_unsupported_or_malformed_authorization_shapes() {
    let (mut transaction, prevout) = p2wpkh_fixture();
    transaction.input[CLAIMANT_INPUT_INDEX].witness.push([0]);
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::UnsupportedWitness)
    );
    assert_eq!(
        verify_claimant_authorization(&[0], CLAIMANT_INPUT_INDEX, std::slice::from_ref(&prevout),),
        Err(AuthorizationError::MalformedTransaction)
    );
    assert_eq!(
        verify_claimant_authorization(&serialize(&transaction), 1, std::slice::from_ref(&prevout),),
        Err(AuthorizationError::InputMissing)
    );
    assert_eq!(
        verify_claimant_authorization(&serialize(&transaction), CLAIMANT_INPUT_INDEX, &[]),
        Err(AuthorizationError::PrevoutCountMismatch)
    );

    let (mut taproot_without_signature, taproot_prevout) = p2tr_fixture();
    taproot_without_signature.input[CLAIMANT_INPUT_INDEX].witness = Witness::new();
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&taproot_without_signature),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&taproot_prevout),
        ),
        Err(AuthorizationError::UnsupportedWitness)
    );

    let mut non_native = transaction.clone();
    non_native.input[CLAIMANT_INPUT_INDEX].script_sig = Builder::new().push_int(1).into_script();
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&non_native),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::NonEmptyScriptSig)
    );

    let (mut transaction, prevout) = p2tr_fixture();
    let mut unsupported_sighash = transaction.input[CLAIMANT_INPUT_INDEX].witness[0].to_vec();
    unsupported_sighash.push(TapSighashType::Single as u8);
    transaction.input[CLAIMANT_INPUT_INDEX].witness = Witness::from_slice(&[unsupported_sighash]);
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::UnsupportedSighash)
    );
}

#[cfg_attr(not(target_arch = "wasm32"), test)]
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
fn rejects_wrong_scripts_keys_signatures_and_sighash_modes() {
    let (mut transaction, prevout) = p2wpkh_fixture();
    let mut signature = transaction.input[CLAIMANT_INPUT_INDEX].witness[0].to_vec();
    *signature.last_mut().expect("signature has a tag") = EcdsaSighashType::Single as u8;
    transaction.input[CLAIMANT_INPUT_INDEX].witness = Witness::from_slice(&[
        signature,
        transaction.input[CLAIMANT_INPUT_INDEX].witness[1].to_vec(),
    ]);
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::UnsupportedSighash)
    );

    let (mut transaction, prevout) = p2wpkh_fixture();
    transaction.input[CLAIMANT_INPUT_INDEX].witness = Witness::from_slice(&[
        transaction.input[CLAIMANT_INPUT_INDEX].witness[0].to_vec(),
        vec![0; 33],
    ]);
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::InvalidPublicKey)
    );

    let (transaction, mut prevout) = p2wpkh_fixture();
    prevout.script_pubkey = ScriptBuf::new_p2wpkh(&bitcoin::WPubkeyHash::from_byte_array([8; 20]));
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::InvalidScript)
    );

    let (transaction, mut prevout) = p2tr_fixture();
    prevout.script_pubkey = ScriptBuf::new_p2wsh(&bitcoin::WScriptHash::from_byte_array([9; 32]));
    assert_eq!(
        verify_claimant_authorization(
            &serialize(&transaction),
            CLAIMANT_INPUT_INDEX,
            std::slice::from_ref(&prevout),
        ),
        Err(AuthorizationError::UnsupportedScript)
    );
}

use bitcoin::consensus::deserialize;
use bitcoin::hashes::Hash;
use bitcoin::secp256k1::{ecdsa, schnorr, Message, Secp256k1, XOnlyPublicKey};
use bitcoin::sighash::{EcdsaSighashType, Prevouts, SighashCache, TapSighashType};
use bitcoin::{PublicKey, ScriptBuf, Transaction, TxOut};

const P2WPKH_WITNESS_ITEMS: usize = 2;
const P2TR_KEY_PATH_WITNESS_ITEMS: usize = 1;
const SCHNORR_SIGNATURE_BYTE_LENGTH: usize = 64;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ClaimantScriptType {
    P2tr,
    P2wpkh,
}

#[derive(Debug, PartialEq, Eq)]
pub enum AuthorizationError {
    InputMissing,
    InvalidPublicKey,
    InvalidScript,
    InvalidSignature,
    MalformedTransaction,
    NonEmptyScriptSig,
    PrevoutCountMismatch,
    UnsupportedScript,
    UnsupportedSighash,
    UnsupportedWitness,
}

pub fn verify_claimant_authorization(
    transaction_bytes: &[u8],
    input_index: usize,
    prevouts: &[TxOut],
) -> Result<ClaimantScriptType, AuthorizationError> {
    let transaction: Transaction = match deserialize(transaction_bytes) {
        Ok(transaction) => transaction,
        Err(_) => return Err(AuthorizationError::MalformedTransaction),
    };
    let input = transaction
        .input
        .get(input_index)
        .ok_or(AuthorizationError::InputMissing)?;
    if !input.script_sig.is_empty() {
        return Err(AuthorizationError::NonEmptyScriptSig);
    }
    if prevouts.len() != transaction.input.len() {
        return Err(AuthorizationError::PrevoutCountMismatch);
    }
    let claimant_prevout = prevouts
        .get(input_index)
        .ok_or(AuthorizationError::InputMissing)?;

    if claimant_prevout.script_pubkey.is_p2wpkh() {
        verify_p2wpkh(
            &transaction,
            input_index,
            claimant_prevout,
            input.witness.to_vec(),
        )?;
        return Ok(ClaimantScriptType::P2wpkh);
    }
    if claimant_prevout.script_pubkey.is_p2tr() {
        verify_p2tr(
            &transaction,
            input_index,
            claimant_prevout,
            prevouts,
            input.witness.to_vec(),
        )?;
        return Ok(ClaimantScriptType::P2tr);
    }
    Err(AuthorizationError::UnsupportedScript)
}

fn verify_p2wpkh(
    transaction: &Transaction,
    input_index: usize,
    claimant_prevout: &TxOut,
    witness: Vec<Vec<u8>>,
) -> Result<(), AuthorizationError> {
    if witness.len() != P2WPKH_WITNESS_ITEMS {
        return Err(AuthorizationError::UnsupportedWitness);
    }
    let public_key = match PublicKey::from_slice(&witness[1]) {
        Ok(public_key) => public_key,
        Err(_) => return Err(AuthorizationError::InvalidPublicKey),
    };
    let public_key_hash = match public_key.wpubkey_hash() {
        Ok(hash) => hash,
        Err(_) => return Err(AuthorizationError::InvalidPublicKey),
    };
    let expected_script = ScriptBuf::new_p2wpkh(&public_key_hash);
    if expected_script != claimant_prevout.script_pubkey {
        return Err(AuthorizationError::InvalidScript);
    }
    let signature_bytes = witness[0]
        .split_last()
        .ok_or(AuthorizationError::InvalidSignature)?;
    if *signature_bytes.0 != EcdsaSighashType::All as u8 {
        return Err(AuthorizationError::UnsupportedSighash);
    }
    let signature = match ecdsa::Signature::from_der(signature_bytes.1) {
        Ok(signature) => signature,
        Err(_) => return Err(AuthorizationError::InvalidSignature),
    };
    let sighash = match SighashCache::new(transaction).p2wpkh_signature_hash(
        input_index,
        &claimant_prevout.script_pubkey,
        claimant_prevout.value,
        EcdsaSighashType::All,
    ) {
        Ok(sighash) => sighash,
        Err(_) => return Err(AuthorizationError::InvalidSignature),
    };
    if Secp256k1::verification_only()
        .verify_ecdsa(
            &Message::from_digest(sighash.to_byte_array()),
            &signature,
            &public_key.inner,
        )
        .is_err()
    {
        return Err(AuthorizationError::InvalidSignature);
    }
    Ok(())
}

fn verify_p2tr(
    transaction: &Transaction,
    input_index: usize,
    claimant_prevout: &TxOut,
    prevouts: &[TxOut],
    witness: Vec<Vec<u8>>,
) -> Result<(), AuthorizationError> {
    if witness.len() != P2TR_KEY_PATH_WITNESS_ITEMS {
        return Err(AuthorizationError::UnsupportedWitness);
    }
    let encoded_signature = &witness[0];
    let (signature_bytes, sighash_type) = match encoded_signature.len() {
        SCHNORR_SIGNATURE_BYTE_LENGTH => (encoded_signature.as_slice(), TapSighashType::Default),
        length if length == SCHNORR_SIGNATURE_BYTE_LENGTH + 1 => {
            if encoded_signature[SCHNORR_SIGNATURE_BYTE_LENGTH] != TapSighashType::All as u8 {
                return Err(AuthorizationError::UnsupportedSighash);
            }
            (
                &encoded_signature[..SCHNORR_SIGNATURE_BYTE_LENGTH],
                TapSighashType::All,
            )
        }
        _ => return Err(AuthorizationError::InvalidSignature),
    };
    let signature = match schnorr::Signature::from_slice(signature_bytes) {
        Ok(signature) => signature,
        Err(_) => return Err(AuthorizationError::InvalidSignature),
    };
    let witness_program = claimant_prevout
        .script_pubkey
        .as_bytes()
        .get(2..)
        .ok_or(AuthorizationError::InvalidScript)?;
    let public_key = match XOnlyPublicKey::from_slice(witness_program) {
        Ok(public_key) => public_key,
        Err(_) => return Err(AuthorizationError::InvalidPublicKey),
    };
    let sighash = match SighashCache::new(transaction).taproot_key_spend_signature_hash(
        input_index,
        &Prevouts::All(prevouts),
        sighash_type,
    ) {
        Ok(sighash) => sighash,
        Err(_) => return Err(AuthorizationError::InvalidSignature),
    };
    if Secp256k1::verification_only()
        .verify_schnorr(
            &signature,
            &Message::from_digest(sighash.to_byte_array()),
            &public_key,
        )
        .is_err()
    {
        return Err(AuthorizationError::InvalidSignature);
    }
    Ok(())
}

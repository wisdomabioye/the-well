use bitcoin::absolute::LockTime;
use bitcoin::hashes::Hash;
use bitcoin::key::TweakedPublicKey;
use bitcoin::opcodes::all::OP_RETURN;
use bitcoin::script::{Builder, PushBytesBuf};
use bitcoin::secp256k1::{Keypair, Message, Secp256k1, SecretKey};
use bitcoin::sighash::{EcdsaSighashType, Prevouts, SighashCache, TapSighashType};
use bitcoin::transaction::Version;
use bitcoin::{
    Amount, OutPoint, PublicKey, ScriptBuf, Sequence, Transaction, TxIn, TxOut, Witness,
};

pub const ACTION_BYTES: &[u8] = b"ADOR_CLAIM_ACTION_V1";
pub const CLAIMANT_INPUT_INDEX: usize = 0;
pub const PREVOUT_SATS: u64 = 50_000;
pub const RECIPIENT_SATS: u64 = 40_000;

fn claimant_secret() -> SecretKey {
    SecretKey::from_slice(&[7; 32]).expect("fixture key must be valid")
}

fn unsigned_transaction() -> Transaction {
    let action = PushBytesBuf::try_from(ACTION_BYTES.to_vec()).expect("action must fit");
    Transaction {
        version: Version::TWO,
        lock_time: LockTime::ZERO,
        input: vec![TxIn {
            previous_output: OutPoint::new(bitcoin::Txid::from_byte_array([3; 32]), 1),
            script_sig: ScriptBuf::new(),
            sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
            witness: Witness::new(),
        }],
        output: vec![
            TxOut {
                value: Amount::from_sat(RECIPIENT_SATS),
                script_pubkey: ScriptBuf::new_p2wsh(&bitcoin::WScriptHash::from_byte_array(
                    [4; 32],
                )),
            },
            TxOut {
                value: Amount::ZERO,
                script_pubkey: Builder::new()
                    .push_opcode(OP_RETURN)
                    .push_slice(action)
                    .into_script(),
            },
        ],
    }
}

pub fn p2wpkh_fixture() -> (Transaction, TxOut) {
    let secp = Secp256k1::new();
    let secret = claimant_secret();
    let public_key = PublicKey::new(secret.public_key(&secp));
    let prevout = TxOut {
        value: Amount::from_sat(PREVOUT_SATS),
        script_pubkey: ScriptBuf::new_p2wpkh(
            &public_key.wpubkey_hash().expect("compressed fixture key"),
        ),
    };
    let mut transaction = unsigned_transaction();
    let sighash = SighashCache::new(&transaction)
        .p2wpkh_signature_hash(
            CLAIMANT_INPUT_INDEX,
            &prevout.script_pubkey,
            prevout.value,
            EcdsaSighashType::All,
        )
        .expect("fixture sighash");
    let signature = secp.sign_ecdsa(&Message::from_digest(sighash.to_byte_array()), &secret);
    let mut encoded_signature = signature.serialize_der().to_vec();
    encoded_signature.push(EcdsaSighashType::All as u8);
    transaction.input[CLAIMANT_INPUT_INDEX].witness =
        Witness::from_slice(&[encoded_signature, public_key.to_bytes()]);
    (transaction, prevout)
}

fn p2tr_fixture_with_sighash(sighash_type: TapSighashType) -> (Transaction, TxOut) {
    let secp = Secp256k1::new();
    let keypair = Keypair::from_secret_key(&secp, &claimant_secret());
    let (public_key, _) = keypair.x_only_public_key();
    let prevout = TxOut {
        value: Amount::from_sat(PREVOUT_SATS),
        script_pubkey: ScriptBuf::new_p2tr_tweaked(TweakedPublicKey::dangerous_assume_tweaked(
            public_key,
        )),
    };
    let mut transaction = unsigned_transaction();
    let sighash = SighashCache::new(&transaction)
        .taproot_key_spend_signature_hash(
            CLAIMANT_INPUT_INDEX,
            &Prevouts::All(std::slice::from_ref(&prevout)),
            sighash_type,
        )
        .expect("fixture sighash");
    let signature =
        secp.sign_schnorr_no_aux_rand(&Message::from_digest(sighash.to_byte_array()), &keypair);
    let mut encoded_signature = signature.as_ref().to_vec();
    if sighash_type != TapSighashType::Default {
        encoded_signature.push(sighash_type as u8);
    }
    transaction.input[CLAIMANT_INPUT_INDEX].witness = Witness::from_slice(&[encoded_signature]);
    (transaction, prevout)
}

pub fn p2tr_fixture() -> (Transaction, TxOut) {
    p2tr_fixture_with_sighash(TapSighashType::Default)
}

pub fn p2tr_explicit_all_fixture() -> (Transaction, TxOut) {
    p2tr_fixture_with_sighash(TapSighashType::All)
}

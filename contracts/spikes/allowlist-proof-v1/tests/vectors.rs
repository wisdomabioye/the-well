use allowlist_proof_v1_spike::{hash_leaf, hash_node, AllowlistLeafV1, Network, PaymentAsset};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    canonical_alkanes_revision: String,
    root_hex: String,
    vectors: Vec<Vector>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Vector {
    encoded_hex: String,
    hash_hex: String,
    input: Input,
    name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Input {
    launch_commitment_hex: String,
    max_allocation: String,
    network: String,
    payment_asset: PaymentAssetFixture,
    phase_id_hex: String,
    price_override: Option<String>,
    script_pub_key_hex: String,
    snapshot_version: u32,
    valid_from: Option<String>,
    valid_until: Option<String>,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum PaymentAssetFixture {
    Bitcoin,
    Alkane { block: String, transaction: String },
}

fn fixed_bytes<const LENGTH: usize>(value: &str) -> [u8; LENGTH] {
    hex::decode(value)
        .expect("fixture hex must decode")
        .try_into()
        .unwrap_or_else(|_| panic!("fixture must contain exactly {LENGTH} bytes"))
}

fn parse_optional<T: std::str::FromStr>(value: &Option<String>) -> Option<T> {
    value
        .as_ref()
        .map(|item| item.parse().ok().expect("fixture integer must parse"))
}

fn leaf_from(input: &Input) -> AllowlistLeafV1 {
    let network = match input.network.as_str() {
        "bitcoin" => Network::Bitcoin,
        "testnet" => Network::Testnet,
        "signet" => Network::Signet,
        "regtest" => Network::Regtest,
        value => panic!("unsupported fixture network: {value}"),
    };
    let payment_asset = match &input.payment_asset {
        PaymentAssetFixture::Bitcoin => PaymentAsset::Bitcoin,
        PaymentAssetFixture::Alkane { block, transaction } => PaymentAsset::Alkane {
            block: block.parse().expect("fixture block must parse"),
            transaction: transaction.parse().expect("fixture transaction must parse"),
        },
    };
    AllowlistLeafV1 {
        network,
        launch_commitment: fixed_bytes(&input.launch_commitment_hex),
        phase_id: fixed_bytes(&input.phase_id_hex),
        snapshot_version: input.snapshot_version,
        script_pubkey: hex::decode(&input.script_pub_key_hex).expect("script hex must decode"),
        max_allocation: input.max_allocation.parse().expect("allocation must parse"),
        payment_asset,
        price_override: parse_optional(&input.price_override),
        valid_from: parse_optional(&input.valid_from),
        valid_until: parse_optional(&input.valid_until),
    }
}

#[test]
fn rust_matches_the_shared_typescript_vectors() {
    let fixture: Fixture = serde_json::from_str(include_str!(
        "../../../../packages/shared/test/fixtures/allowlist-leaf-v1.json"
    ))
    .expect("shared fixture must be valid JSON");
    assert_eq!(fixture.canonical_alkanes_revision.len(), 40);
    assert_eq!(fixture.vectors.len(), 2);

    let hashes: Vec<[u8; 32]> = fixture
        .vectors
        .iter()
        .map(|vector| {
            assert!(!vector.name.is_empty());
            let leaf = leaf_from(&vector.input);
            let encoded = leaf.encode().expect("leaf must encode");
            assert_eq!(hex::encode(&encoded), vector.encoded_hex);
            assert_eq!(
                AllowlistLeafV1::decode(&encoded).expect("leaf must decode"),
                leaf
            );
            let hash = hash_leaf(&encoded);
            assert_eq!(hex::encode(hash), vector.hash_hex);
            hash
        })
        .collect();
    assert_eq!(
        hex::encode(hash_node(&hashes[0], &hashes[1])),
        fixture.root_hex
    );
    assert_eq!(
        hash_node(&hashes[0], &hashes[1]),
        hash_node(&hashes[1], &hashes[0])
    );
}

#[test]
fn rust_decoder_rejects_non_canonical_bytes() {
    let fixture: Fixture = serde_json::from_str(include_str!(
        "../../../../packages/shared/test/fixtures/allowlist-leaf-v1.json"
    ))
    .expect("shared fixture must be valid JSON");
    let mut encoded = hex::decode(&fixture.vectors[0].encoded_hex).expect("fixture must decode");

    let mut trailing = encoded.clone();
    trailing.push(0);
    assert!(AllowlistLeafV1::decode(&trailing).is_err());
    encoded[0] = 0;
    assert!(AllowlistLeafV1::decode(&encoded).is_err());
    assert!(AllowlistLeafV1::decode(&encoded[..10]).is_err());

    let canonical = hex::decode(&fixture.vectors[0].encoded_hex).expect("fixture must decode");
    for length in 0..canonical.len() {
        assert!(
            AllowlistLeafV1::decode(&canonical[..length]).is_err(),
            "truncated prefix of {length} bytes was accepted"
        );
    }
    for (offset, invalid_tag) in [(22, 255), (127, 255), (128, 255), (129, 255)] {
        let mut malformed = canonical.clone();
        malformed[offset] = invalid_tag;
        assert!(AllowlistLeafV1::decode(&malformed).is_err());
    }
}

#[test]
fn rust_rejects_invalid_leaf_invariants() {
    let base = AllowlistLeafV1 {
        network: Network::Regtest,
        launch_commitment: [0; 32],
        phase_id: [0; 16],
        snapshot_version: 1,
        script_pubkey: vec![0x51],
        max_allocation: 1,
        payment_asset: PaymentAsset::Bitcoin,
        price_override: None,
        valid_from: None,
        valid_until: None,
    };
    assert!(AllowlistLeafV1 {
        snapshot_version: 0,
        ..base.clone()
    }
    .encode()
    .is_err());
    assert!(AllowlistLeafV1 {
        script_pubkey: Vec::new(),
        ..base.clone()
    }
    .encode()
    .is_err());
    assert!(AllowlistLeafV1 {
        script_pubkey: vec![0; 10_001],
        ..base.clone()
    }
    .encode()
    .is_err());
    assert!(AllowlistLeafV1 {
        max_allocation: 0,
        ..base.clone()
    }
    .encode()
    .is_err());
    assert!(AllowlistLeafV1 {
        valid_from: Some(2),
        valid_until: Some(1),
        ..base.clone()
    }
    .encode()
    .is_err());

    for network in [Network::Bitcoin, Network::Testnet] {
        let leaf = AllowlistLeafV1 {
            network,
            ..base.clone()
        };
        let encoded = leaf.encode().expect("network leaf must encode");
        assert_eq!(AllowlistLeafV1::decode(&encoded), Ok(leaf));
    }
}

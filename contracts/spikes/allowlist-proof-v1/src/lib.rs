use sha2::{Digest, Sha256};

pub const DOMAIN: &[u8] = b"ADOR_ALLOWLIST_LEAF_V1";
pub const HASH_BYTE_LENGTH: usize = 32;
pub const MAXIMUM_SCRIPT_BYTE_LENGTH: usize = 10_000;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Network {
    Bitcoin,
    Testnet,
    Signet,
    Regtest,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PaymentAsset {
    Bitcoin,
    Alkane { block: u128, transaction: u128 },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AllowlistLeafV1 {
    pub network: Network,
    pub launch_commitment: [u8; 32],
    pub phase_id: [u8; 16],
    pub snapshot_version: u32,
    pub script_pubkey: Vec<u8>,
    pub max_allocation: u128,
    pub payment_asset: PaymentAsset,
    pub price_override: Option<u128>,
    pub valid_from: Option<u64>,
    pub valid_until: Option<u64>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum CodecError {
    InvalidAllocation,
    InvalidDomain,
    InvalidNetwork,
    InvalidOptionalTag,
    InvalidPaymentAsset,
    InvalidScriptLength,
    InvalidSnapshotVersion,
    InvalidValidityBounds,
    TrailingBytes,
    Truncated,
}

impl AllowlistLeafV1 {
    pub fn encode(&self) -> Result<Vec<u8>, CodecError> {
        self.validate()?;
        let mut output = Vec::new();
        output.extend_from_slice(DOMAIN);
        output.push(network_tag(self.network));
        output.extend_from_slice(&self.launch_commitment);
        output.extend_from_slice(&self.phase_id);
        output.extend_from_slice(&self.snapshot_version.to_le_bytes());
        output.extend_from_slice(&(self.script_pubkey.len() as u16).to_le_bytes());
        output.extend_from_slice(&self.script_pubkey);
        output.extend_from_slice(&self.max_allocation.to_le_bytes());
        match self.payment_asset {
            PaymentAsset::Bitcoin => output.push(0),
            PaymentAsset::Alkane { block, transaction } => {
                output.push(1);
                output.extend_from_slice(&block.to_le_bytes());
                output.extend_from_slice(&transaction.to_le_bytes());
            }
        }
        encode_optional(self.price_override, &mut output);
        encode_optional(self.valid_from, &mut output);
        encode_optional(self.valid_until, &mut output);
        Ok(output)
    }

    pub fn decode(bytes: &[u8]) -> Result<Self, CodecError> {
        let mut reader = Reader::new(bytes);
        if reader.read::<{ DOMAIN.len() }>()?.as_slice() != DOMAIN {
            return Err(CodecError::InvalidDomain);
        }
        let network = match reader.read_u8()? {
            0 => Network::Bitcoin,
            1 => Network::Testnet,
            2 => Network::Signet,
            3 => Network::Regtest,
            _ => return Err(CodecError::InvalidNetwork),
        };
        let launch_commitment = reader.read()?;
        let phase_id = reader.read()?;
        let snapshot_version = u32::from_le_bytes(reader.read()?);
        let script_length = u16::from_le_bytes(reader.read()?) as usize;
        let script_pubkey = reader.read_vec(script_length)?;
        let max_allocation = u128::from_le_bytes(reader.read()?);
        let payment_asset = match reader.read_u8()? {
            0 => PaymentAsset::Bitcoin,
            1 => PaymentAsset::Alkane {
                block: u128::from_le_bytes(reader.read()?),
                transaction: u128::from_le_bytes(reader.read()?),
            },
            _ => return Err(CodecError::InvalidPaymentAsset),
        };
        let leaf = Self {
            network,
            launch_commitment,
            phase_id,
            snapshot_version,
            script_pubkey,
            max_allocation,
            payment_asset,
            price_override: reader.read_optional_u128()?,
            valid_from: reader.read_optional_u64()?,
            valid_until: reader.read_optional_u64()?,
        };
        if !reader.done() {
            return Err(CodecError::TrailingBytes);
        }
        leaf.validate()?;
        Ok(leaf)
    }

    fn validate(&self) -> Result<(), CodecError> {
        if self.snapshot_version == 0 {
            return Err(CodecError::InvalidSnapshotVersion);
        }
        if self.script_pubkey.is_empty() || self.script_pubkey.len() > MAXIMUM_SCRIPT_BYTE_LENGTH {
            return Err(CodecError::InvalidScriptLength);
        }
        if self.max_allocation == 0 {
            return Err(CodecError::InvalidAllocation);
        }
        if matches!((self.valid_from, self.valid_until), (Some(from), Some(until)) if from > until)
        {
            return Err(CodecError::InvalidValidityBounds);
        }
        Ok(())
    }
}

struct Reader<'a> {
    bytes: &'a [u8],
    offset: usize,
}

impl<'a> Reader<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, offset: 0 }
    }

    fn done(&self) -> bool {
        self.offset == self.bytes.len()
    }

    fn read<const LENGTH: usize>(&mut self) -> Result<[u8; LENGTH], CodecError> {
        let end = self
            .offset
            .checked_add(LENGTH)
            .ok_or(CodecError::Truncated)?;
        let source = self
            .bytes
            .get(self.offset..end)
            .ok_or(CodecError::Truncated)?;
        let mut value = [0; LENGTH];
        value.copy_from_slice(source);
        self.offset = end;
        Ok(value)
    }

    fn read_vec(&mut self, length: usize) -> Result<Vec<u8>, CodecError> {
        let end = self
            .offset
            .checked_add(length)
            .ok_or(CodecError::Truncated)?;
        let value = self
            .bytes
            .get(self.offset..end)
            .ok_or(CodecError::Truncated)?
            .to_vec();
        self.offset = end;
        Ok(value)
    }

    fn read_u8(&mut self) -> Result<u8, CodecError> {
        Ok(self.read::<1>()?[0])
    }

    fn read_optional_u128(&mut self) -> Result<Option<u128>, CodecError> {
        match self.read_u8()? {
            0 => Ok(None),
            1 => Ok(Some(u128::from_le_bytes(self.read()?))),
            _ => Err(CodecError::InvalidOptionalTag),
        }
    }

    fn read_optional_u64(&mut self) -> Result<Option<u64>, CodecError> {
        match self.read_u8()? {
            0 => Ok(None),
            1 => Ok(Some(u64::from_le_bytes(self.read()?))),
            _ => Err(CodecError::InvalidOptionalTag),
        }
    }
}

fn network_tag(network: Network) -> u8 {
    match network {
        Network::Bitcoin => 0,
        Network::Testnet => 1,
        Network::Signet => 2,
        Network::Regtest => 3,
    }
}

fn encode_optional<T: Copy + Into<u128>>(value: Option<T>, output: &mut Vec<u8>) {
    match value {
        None => output.push(0),
        Some(value) => {
            output.push(1);
            let encoded = value.into().to_le_bytes();
            let width = std::mem::size_of::<T>();
            output.extend_from_slice(&encoded[..width]);
        }
    }
}

pub fn hash_leaf(bytes: &[u8]) -> [u8; HASH_BYTE_LENGTH] {
    Sha256::digest(bytes).into()
}

pub fn hash_node(
    left: &[u8; HASH_BYTE_LENGTH],
    right: &[u8; HASH_BYTE_LENGTH],
) -> [u8; HASH_BYTE_LENGTH] {
    let mut hasher = Sha256::new();
    let (first, second) = if left <= right {
        (left, right)
    } else {
        (right, left)
    };
    hasher.update(first);
    hasher.update(second);
    hasher.finalize().into()
}

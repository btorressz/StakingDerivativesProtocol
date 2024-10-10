
use solana_program::program_pack::{IsInitialized, Pack, Sealed};
use solana_program::pubkey::Pubkey;
use solana_program::program_error::ProgramError;
use std::convert::TryInto;

// Constants for the maximum number of validators and the size of ValidatorInfo
const MAX_VALIDATORS: usize = 10;
const VALIDATOR_INFO_SIZE: usize = 72;

// Constants for governance and referrals
const MAX_PROPOSALS: usize = 100;
const MAX_REFERRALS: usize = 100;

pub struct StakingPoolState {
    pub is_initialized: bool,
    pub total_staked: u64,
    pub total_issued_tokens: u64,
    pub reward_rate_per_token: u64,
    pub staking_pool_pubkey: Pubkey,
    pub accumulated_fees: u64,
    pub total_compounded_rewards: u64,
    pub emergency_unstake_penalties: u64,
    pub validator_list: Vec<ValidatorInfo>,
    pub reward_checkpoint: u64, // New field for rewards distribution checkpoint
}

pub struct ValidatorInfo {
    pub validator_pubkey: Pubkey,
    pub stake_account_pubkey: Pubkey,
    pub total_staked: u64,
}

pub struct GovernanceProposal {
    pub proposal_id: u64,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub executed: bool,
}

pub struct Referral {
    pub referrer: Pubkey,
    pub referred_user: Pubkey,
}

impl Sealed for StakingPoolState {}
impl Sealed for ValidatorInfo {}
impl Sealed for GovernanceProposal {}
impl Sealed for Referral {}

impl IsInitialized for StakingPoolState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for StakingPoolState {
    const LEN: usize = 1 + 8 + 8 + 8 + 32 + 8 + 8 + 8 + 8 + MAX_VALIDATORS * VALIDATOR_INFO_SIZE;

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let is_initialized = src[0] != 0;
        let total_staked = u64::from_le_bytes(src[1..9].try_into().unwrap());
        let total_issued_tokens = u64::from_le_bytes(src[9..17].try_into().unwrap());
        let reward_rate_per_token = u64::from_le_bytes(src[17..25].try_into().unwrap());
        let staking_pool_pubkey = Pubkey::new_from_array(src[25..57].try_into().unwrap());
        let accumulated_fees = u64::from_le_bytes(src[57..65].try_into().unwrap());
        let total_compounded_rewards = u64::from_le_bytes(src[65..73].try_into().unwrap());
        let emergency_unstake_penalties = u64::from_le_bytes(src[73..81].try_into().unwrap());
        let reward_checkpoint = u64::from_le_bytes(src[81..89].try_into().unwrap());

        // Unpack the list of validators
        let mut validator_list = Vec::new();
        let mut offset = 89;
        while offset < src.len() {
            if src.len() - offset < VALIDATOR_INFO_SIZE {
                break;
            }

            let validator_pubkey = Pubkey::new_from_array(src[offset..offset + 32].try_into().unwrap());
            let stake_account_pubkey = Pubkey::new_from_array(src[offset + 32..offset + 64].try_into().unwrap());
            let total_staked = u64::from_le_bytes(src[offset + 64..offset + 72].try_into().unwrap());

            validator_list.push(ValidatorInfo {
                validator_pubkey,
                stake_account_pubkey,
                total_staked,
            });

            offset += VALIDATOR_INFO_SIZE;
        }

        Ok(Self {
            is_initialized,
            total_staked,
            total_issued_tokens,
            reward_rate_per_token,
            staking_pool_pubkey,
            accumulated_fees,
            total_compounded_rewards,
            emergency_unstake_penalties,
            reward_checkpoint,
            validator_list,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        dst[0] = self.is_initialized as u8;
        dst[1..9].copy_from_slice(&self.total_staked.to_le_bytes());
        dst[9..17].copy_from_slice(&self.total_issued_tokens.to_le_bytes());
        dst[17..25].copy_from_slice(&self.reward_rate_per_token.to_le_bytes());
        dst[25..57].copy_from_slice(self.staking_pool_pubkey.as_ref());
        dst[57..65].copy_from_slice(&self.accumulated_fees.to_le_bytes());
        dst[65..73].copy_from_slice(&self.total_compounded_rewards.to_le_bytes());
        dst[73..81].copy_from_slice(&self.emergency_unstake_penalties.to_le_bytes());
        dst[81..89].copy_from_slice(&self.reward_checkpoint.to_le_bytes());

        // Pack the list of validators
        let mut offset = 89;
        for validator in &self.validator_list {
            if offset + VALIDATOR_INFO_SIZE > dst.len() {
                break;
            }

            dst[offset..offset + 32].copy_from_slice(validator.validator_pubkey.as_ref());
            dst[offset + 32..offset + 64].copy_from_slice(validator.stake_account_pubkey.as_ref());
            dst[offset + 64..offset + 72].copy_from_slice(&validator.total_staked.to_le_bytes());

            offset += VALIDATOR_INFO_SIZE;
        }
    }
}

impl ValidatorInfo {
    // Helper function to serialize ValidatorInfo
    pub fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        if src.len() < 72 {
            return Err(ProgramError::InvalidAccountData);
        }

        let validator_pubkey = Pubkey::new_from_array(src[0..32].try_into().unwrap());
        let stake_account_pubkey = Pubkey::new_from_array(src[32..64].try_into().unwrap());
        let total_staked = u64::from_le_bytes(src[64..72].try_into().unwrap());

        Ok(Self {
            validator_pubkey,
            stake_account_pubkey,
            total_staked,
        })
    }

    pub fn pack_into_slice(&self, dst: &mut [u8]) {
        dst[0..32].copy_from_slice(self.validator_pubkey.as_ref());
        dst[32..64].copy_from_slice(self.stake_account_pubkey.as_ref());
        dst[64..72].copy_from_slice(&self.total_staked.to_le_bytes());
    }
}

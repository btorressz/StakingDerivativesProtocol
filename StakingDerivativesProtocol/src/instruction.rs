
use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;

#[derive(Debug)]
pub enum StakingInstruction {
    /// Deposit SOL and mint staked derivative tokens
    DepositAndMint {
        amount: u64,
    },

    /// Withdraw staked SOL by burning the staked derivative tokens
    Withdraw {
        amount: u64,
    },

    /// Compound the staking rewards by converting rewards to token
    CompoundRewards,

    /// Distribute rewards using the checkpoint system
    DistributeRewards,

    /// Emergency unstake with a penalty
    EmergencyUnstake {
        amount: u64,
    },

    /// Create a referral link
    CreateReferral {
        referrer: Pubkey,
    },

    /// Vote on a governance proposal
    VoteOnProposal {
        proposal_id: u64,
        vote: bool, // true for yes, false for no
    },
}

impl StakingInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match tag {
            0 => {
                let amount = Self::unpack_u64(rest)?;
                Self::DepositAndMint { amount }
            }
            1 => {
                let amount = Self::unpack_u64(rest)?;
                Self::Withdraw { amount }
            }
            2 => Self::CompoundRewards,
            3 => Self::DistributeRewards,
            4 => {
                let amount = Self::unpack_u64(rest)?;
                Self::EmergencyUnstake { amount }
            }
            5 => {
                let referrer = Pubkey::new_from_array(rest[..32].try_into().unwrap());
                Self::CreateReferral { referrer }
            }
            6 => {
                let proposal_id = Self::unpack_u64(&rest[..8])?;
                let vote = rest[8] != 0;
                Self::VoteOnProposal { proposal_id, vote }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    fn unpack_u64(input: &[u8]) -> Result<u64, ProgramError> {
        input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(ProgramError::InvalidInstructionData)
    }
}

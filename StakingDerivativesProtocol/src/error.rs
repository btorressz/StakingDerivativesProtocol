
use thiserror::Error;
use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum StakingError {
    #[error("Invalid Instruction")]
    InvalidInstruction,
    #[error("Insufficient Funds")]
    InsufficientFunds,
    #[error("Account Already Initialized")]
    AccountAlreadyInitialized,
    #[error("Validator Index Out of Bounds")]
    ValidatorIndexOutOfBounds,
    #[error("Invalid Amount")]
    InvalidAmount,
    #[error("Compounding Error")]
    CompoundingError,
    #[error("Emergency Unstake Not Allowed")]
    EmergencyUnstakeNotAllowed,
}

impl From<StakingError> for ProgramError {
    fn from(e: StakingError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

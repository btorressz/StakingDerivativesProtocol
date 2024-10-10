// src/utils.rs

use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Validates that the given account is a signer.
pub fn validate_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    if !account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}

/// Validates that the given account is owned by the specified program.
pub fn validate_program_owned(account: &AccountInfo, program_id: &Pubkey) -> Result<(), ProgramError> {
    if account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}

/// Validates that the account has sufficient funds.
pub fn validate_sufficient_funds(
    account: &AccountInfo,
    amount: u64,
) -> Result<(), ProgramError> {
    if account.lamports() < amount {
        return Err(ProgramError::InsufficientFunds);
    }
    Ok(())
}

/// Validates that the given account is owned by a specific Pubkey.
pub fn validate_account_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<(), ProgramError> {
    if account.owner != expected_owner {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}

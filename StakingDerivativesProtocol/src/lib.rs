
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

mod processor;
mod instruction;
mod state;
mod error;
mod utils;
mod fees;
mod rewards;
mod governance; 
mod referral;   

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Staking Derivatives Protocol: Entry");
    processor::process(program_id, accounts, instruction_data)
}

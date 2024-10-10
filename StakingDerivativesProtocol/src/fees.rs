
pub struct FeeStructure {
    pub staking_fee: u64, // Fee for staking, e.g., 1%
    pub withdrawal_fee: u64, // Fee for regular withdrawal, e.g., 1%
    pub emergency_unstake_penalty: u64, // Penalty for emergency unstake, e.g., 5%
}

impl FeeStructure {
    pub fn default() -> Self {
        Self {
            staking_fee: 1, // Default to 1%
            withdrawal_fee: 1, // Default to 1%
            emergency_unstake_penalty: 5, // Default to 5%
        }
    }

    pub fn calculate_fee(&self, amount: u64, fee_type: &str) -> u64 {
        let fee_percentage = match fee_type {
            "staking" => self.staking_fee,
            "withdrawal" => self.withdrawal_fee,
            "emergency" => self.emergency_unstake_penalty,
            _ => 0,
        };
        amount * fee_percentage / 100
    }
}

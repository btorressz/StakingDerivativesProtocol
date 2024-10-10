# StakingDerivativesProtocol

# Solana Staking Derivatives Protocol
(This is an example of a project I have made for a client)
This project implements a staking derivatives protocol on the Solana blockchain. The protocol allows users to tokenize their staked SOL (e.g., liquid staking) by minting derivative tokens. Users can deposit SOL, receive tokenized representations, and earn staking rewards. These tokenized assets can then be freely traded or used as collateral in other DeFi protocols.


## Overview

The Solana Staking Derivatives Protocol is a decentralized application (dApp) that allows users to:
1. Deposit SOL and receive derivative tokens representing the staked SOL.
2. Withdraw staked SOL by burning the derivative tokens.
3. Compound staking rewards periodically.
4. Perform emergency unstaking with penalties.
5. Distribute rewards using a checkpoint-based reward distribution system.
6. Participate in a governance mechanism by voting on proposals.
7. Create referral links to incentivize new users.

 The program is written in Rust, with a corresponding client written in TypeScript for interacting with the program on Solana Playground.

 ## Features

1. **Minting Derivative Tokens:** Users can deposit SOL and mint derivative tokens representing their staked assets.
2. **Rewards Calculation and Compounding:** Staking rewards are calculated and updated periodically. Users can compound their rewards.
3. **Emergency Unstaking:** Users can unstake their SOL instantly with an emergency penalty.
4. **Referral Program:** Users can create referral links to incentivize new users to stake.
5. **Governance Mechanism:** The program includes a simple voting mechanism where users can vote on governance proposals.
6. **Checkpoint-Based Rewards Distribution:** Rewards are distributed periodically using a checkpoint system for optimization.
7. **Advanced Fee Management:** Fees are accumulated and used to fund development or other purposes

## License 
This Project is under the **MIT LICENSE**
   


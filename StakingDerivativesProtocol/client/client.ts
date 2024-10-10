// Client (client.ts)

async function main() {
  try {
    console.log("My address:", pg.wallet.publicKey.toString());
    const balance = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

    // Example usage of various staking functions
    const stakingPoolAddress = "ENTER_YOUR_STAKING_POOL_ADDRESS_HERE"; // Replace with a valid base58 public key
    const stakingPoolPubkey = new web3.PublicKey(stakingPoolAddress);

    // Deposit SOL into the staking pool
    await depositSol(stakingPoolPubkey, 1); // Depositing 1 SOL

    // Withdraw SOL from the staking pool
    await withdrawSol(stakingPoolPubkey, 0.5); // Withdrawing 0.5 SOL

    // Create a referral link
    const referralPubkey = new web3.Keypair().publicKey;
    await createReferral(stakingPoolPubkey, referralPubkey);

    // Vote on a proposal
    await voteOnProposal(stakingPoolPubkey, 1, true); // Voting "yes" on proposal with ID 1

    // Distribute rewards
    await distributeRewards(stakingPoolPubkey);
  } catch (err) {
    console.error("An error occurred:", err);
  }
}

/**
 * Deposit SOL into the staking pool.
 * @param stakingPoolPubkey The public key of the staking pool.
 * @param amount The amount of SOL to deposit.
 */
async function depositSol(stakingPoolPubkey: web3.PublicKey, amount: number) {
  const lamports = amount * web3.LAMPORTS_PER_SOL;
  const depositAndMintIx = new web3.TransactionInstruction({
    programId: pg.PROGRAM_ID,
    keys: [
      { pubkey: stakingPoolPubkey, isSigner: false, isWritable: true },
      { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
    ],
    data: Buffer.concat([
      Buffer.from(Uint8Array.of(0)), // Instruction enum index for DepositAndMint
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(lamports)]).buffer)), // Amount to deposit
    ]),
  });

  const tx = new web3.Transaction().add(depositAndMintIx);
  const signature = await web3.sendAndConfirmTransaction(pg.connection, tx, [
    pg.wallet.keypair,
  ]);
  console.log(`Deposited ${amount} SOL, transaction signature: ${signature}`);
}

/**
 * Withdraw SOL from the staking pool.
 * @param stakingPoolPubkey The public key of the staking pool.
 * @param amount The amount of SOL to withdraw.
 */
async function withdrawSol(stakingPoolPubkey: web3.PublicKey, amount: number) {
  const lamports = amount * web3.LAMPORTS_PER_SOL;
  const withdrawIx = new web3.TransactionInstruction({
    programId: pg.PROGRAM_ID,
    keys: [
      { pubkey: stakingPoolPubkey, isSigner: false, isWritable: true },
      { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
    ],
    data: Buffer.concat([
      Buffer.from(Uint8Array.of(1)), // Instruction enum index for Withdraw
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(lamports)]).buffer)), // Amount to withdraw
    ]),
  });

  const tx = new web3.Transaction().add(withdrawIx);
  const signature = await web3.sendAndConfirmTransaction(pg.connection, tx, [
    pg.wallet.keypair,
  ]);
  console.log(`Withdrew ${amount} SOL, transaction signature: ${signature}`);
}

/**
 * Create a referral link.
 * @param stakingPoolPubkey The public key of the staking pool.
 * @param referralPubkey The public key of the referrer.
 */
async function createReferral(
  stakingPoolPubkey: web3.PublicKey,
  referralPubkey: web3.PublicKey
) {
  const createReferralIx = new web3.TransactionInstruction({
    programId: pg.PROGRAM_ID,
    keys: [
      { pubkey: stakingPoolPubkey, isSigner: false, isWritable: true },
      { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
    ],
    data: Buffer.concat([
      Buffer.from(Uint8Array.of(5)), // Instruction enum index for CreateReferral
      referralPubkey.toBuffer(), // Referrer public key
    ]),
  });

  const tx = new web3.Transaction().add(createReferralIx);
  const signature = await web3.sendAndConfirmTransaction(pg.connection, tx, [
    pg.wallet.keypair,
  ]);
  console.log(
    `Referral created for referrer: ${referralPubkey.toString()}, transaction signature: ${signature}`
  );
}

/**
 * Vote on a governance proposal.
 * @param stakingPoolPubkey The public key of the staking pool.
 * @param proposalId The ID of the proposal to vote on.
 * @param vote True for yes, false for no.
 */
async function voteOnProposal(
  stakingPoolPubkey: web3.PublicKey,
  proposalId: number,
  vote: boolean
) {
  const voteOnProposalIx = new web3.TransactionInstruction({
    programId: pg.PROGRAM_ID,
    keys: [
      { pubkey: stakingPoolPubkey, isSigner: false, isWritable: true },
      { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
    ],
    data: Buffer.concat([
      Buffer.from(Uint8Array.of(6)), // Instruction enum index for VoteOnProposal
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer)), // Proposal ID
      Buffer.from([vote ? 1 : 0]), // Vote (1 for yes, 0 for no)
    ]),
  });

  const tx = new web3.Transaction().add(voteOnProposalIx);
  const signature = await web3.sendAndConfirmTransaction(pg.connection, tx, [
    pg.wallet.keypair,
  ]);
  console.log(
    `Voted ${vote ? "yes" : "no"} on proposal ${proposalId}, transaction signature: ${signature}`
  );
}

/**
 * Distribute rewards using the checkpoint system.
 * @param stakingPoolPubkey The public key of the staking pool.
 */
async function distributeRewards(stakingPoolPubkey: web3.PublicKey) {
  const distributeRewardsIx = new web3.TransactionInstruction({
    programId: pg.PROGRAM_ID,
    keys: [
      { pubkey: stakingPoolPubkey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(Uint8Array.of(4)), // Instruction enum index for DistributeRewards
  });

  const tx = new web3.Transaction().add(distributeRewardsIx);
  const signature = await web3.sendAndConfirmTransaction(pg.connection, tx, [
    pg.wallet.keypair,
  ]);
  console.log(
    `Rewards distributed, transaction signature: ${signature}`
  );
}

// Run the main function
main().catch((err) => {
  console.error("An error occurred while running the main function:", err);
});

// No imports needed: web3, borsh, pg, and more are globally available

/**
 * The state of a staking pool account managed by the staking program.
 */
class StakingPoolAccount {
  isInitialized = 0;
  totalStaked = BigInt(0);
  totalIssuedTokens = BigInt(0);
  accumulatedFees = BigInt(0);
  totalCompoundedRewards = BigInt(0);
  emergencyUnstakePenalties = BigInt(0);
  rewardCheckpoint = BigInt(0);

  constructor(fields: {
    isInitialized: number;
    totalStaked: bigint;
    totalIssuedTokens: bigint;
    accumulatedFees: bigint;
    totalCompoundedRewards: bigint;
    emergencyUnstakePenalties: bigint;
    rewardCheckpoint: bigint;
  } | undefined = undefined) {
    if (fields) {
      this.isInitialized = fields.isInitialized;
      this.totalStaked = fields.totalStaked;
      this.totalIssuedTokens = fields.totalIssuedTokens;
      this.accumulatedFees = fields.accumulatedFees;
      this.totalCompoundedRewards = fields.totalCompoundedRewards;
      this.emergencyUnstakePenalties = fields.emergencyUnstakePenalties;
      this.rewardCheckpoint = fields.rewardCheckpoint;
    }
  }
}

/**
 * Borsh schema definition for staking pool accounts.
 */
const StakingPoolSchema = new Map([
  [
    StakingPoolAccount,
    {
      kind: "struct",
      fields: [
        ["isInitialized", "u8"],
        ["totalStaked", "u64"],
        ["totalIssuedTokens", "u64"],
        ["accumulatedFees", "u64"],
        ["totalCompoundedRewards", "u64"],
        ["emergencyUnstakePenalties", "u64"],
        ["rewardCheckpoint", "u64"],
      ],
    },
  ],
]);

/**
 * The expected size of each staking pool account.
 */
const STAKING_POOL_SIZE = borsh.serialize(
  StakingPoolSchema,
  new StakingPoolAccount()
).length;

describe("Staking Program Tests", () => {
  let stakingPoolKp;

  before(async () => {
    // Create the staking pool account
    stakingPoolKp = new web3.Keypair();
    const lamports = await pg.connection.getMinimumBalanceForRentExemption(
      STAKING_POOL_SIZE
    );

    const createStakingPoolAccountIx = web3.SystemProgram.createAccount({
      fromPubkey: pg.wallet.publicKey,
      lamports,
      newAccountPubkey: stakingPoolKp.publicKey,
      programId: pg.PROGRAM_ID,
      space: STAKING_POOL_SIZE,
    });

    // Send transaction to create the staking pool account
    const tx = new web3.Transaction().add(createStakingPoolAccountIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [
      pg.wallet.keypair,
      stakingPoolKp,
    ]);
    console.log("Staking pool account created");
  });

  it("Deposit and Mint", async () => {
    const amount = 1000;
    const depositAndMintIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(0)), // Instruction enum index for DepositAndMint
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(amount)]).buffer)), // Amount to deposit
      ]),
    });

    const tx = new web3.Transaction().add(depositAndMintIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );
    const stakingPoolData = borsh.deserialize(
      StakingPoolSchema,
      StakingPoolAccount,
      stakingPoolAccountInfo.data
    );

    // Assertions
    assert.equal(stakingPoolData.totalStaked, BigInt(amount));
    assert.equal(stakingPoolData.totalIssuedTokens, BigInt(amount));
    assert.equal(stakingPoolData.isInitialized, 1);
  });

  it("Withdraw", async () => {
    const withdrawAmount = 500;
    const withdrawIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(1)), // Instruction enum index for Withdraw
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(withdrawAmount)]).buffer)), // Amount to withdraw
      ]),
    });

    const tx = new web3.Transaction().add(withdrawIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );
    const stakingPoolData = borsh.deserialize(
      StakingPoolSchema,
      StakingPoolAccount,
      stakingPoolAccountInfo.data
    );

    // Assertions
    assert.equal(stakingPoolData.totalStaked, BigInt(1000 - withdrawAmount));
    assert.equal(stakingPoolData.totalIssuedTokens, BigInt(1000 - withdrawAmount));
  });

  it("Compound Rewards", async () => {
    const compoundRewardsIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
      ],
      data: Buffer.from(Uint8Array.of(2)), // Instruction enum index for CompoundRewards
    });

    const tx = new web3.Transaction().add(compoundRewardsIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );
    const stakingPoolData = borsh.deserialize(
      StakingPoolSchema,
      StakingPoolAccount,
      stakingPoolAccountInfo.data
    );

    // Assertions
    assert(
      stakingPoolData.totalCompoundedRewards > BigInt(0),
      "Compounded rewards should be greater than zero"
    );
  });

  it("Emergency Unstake", async () => {
    const emergencyUnstakeAmount = 200;
    const emergencyUnstakeIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(3)), // Instruction enum index for EmergencyUnstake
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(emergencyUnstakeAmount)]).buffer)), // Amount to unstake
      ]),
    });

    const tx = new web3.Transaction().add(emergencyUnstakeIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );
    const stakingPoolData = borsh.deserialize(
      StakingPoolSchema,
      StakingPoolAccount,
      stakingPoolAccountInfo.data
    );

    // Assertions
    assert.equal(
      stakingPoolData.totalStaked,
      BigInt(1000 - 500 - emergencyUnstakeAmount)
    );
    assert(
      stakingPoolData.emergencyUnstakePenalties > BigInt(0),
      "Emergency unstake penalties should be applied"
    );
  });

  it("Create Referral", async () => {
    const referralPubkey = new web3.Keypair().publicKey;
    const createReferralIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(5)), // Instruction enum index for CreateReferral
        referralPubkey.toBuffer(), // Referrer public key
      ]),
    });

    const tx = new web3.Transaction().add(createReferralIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );

    // Check that the referral was created
    assert(stakingPoolAccountInfo, "Referral creation should succeed");
  });

  it("Vote on Proposal", async () => {
    const proposalId = 1;
    const vote = true; // True for yes, false for no
    const voteOnProposalIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(6)), // Instruction enum index for VoteOnProposal
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer)), // Proposal ID
        Buffer.from([vote ? 1 : 0]), // Vote
      ]),
    });

    const tx = new web3.Transaction().add(voteOnProposalIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account to verify the proposal vote
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );

    // Check that the proposal vote was successful
    assert(stakingPoolAccountInfo, "Vote on proposal should succeed");
  });

  it("Distribute Rewards", async () => {
    const distributeRewardsIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
      ],
      data: Buffer.from(Uint8Array.of(4)), // Instruction enum index for DistributeRewards
    });

    const tx = new web3.Transaction().add(distributeRewardsIx);
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);

    // Fetch the staking pool account
    const stakingPoolAccountInfo = await pg.connection.getAccountInfo(
      stakingPoolKp.publicKey
    );
    const stakingPoolData = borsh.deserialize(
      StakingPoolSchema,
      StakingPoolAccount,
      stakingPoolAccountInfo.data
    );

    // Assertions
    assert(
      stakingPoolData.rewardCheckpoint > BigInt(0),
      "Reward checkpoint should be updated"
    );
  });

  it("Withdraw More Than Available (Failure Scenario)", async () => {
    const excessiveWithdrawAmount = 2000; // More than currently staked
    const withdrawIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(1)), // Instruction enum index for Withdraw
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(excessiveWithdrawAmount)]).buffer)), // Amount to withdraw
      ]),
    });

    try {
      const tx = new web3.Transaction().add(withdrawIx);
      await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);
      assert.fail("The transaction should have failed");
    } catch (err) {
      assert(err.message.includes("Transaction simulation failed"), "Expected transaction failure");
    }
  });

  it("Vote on Non-Existent Proposal (Failure Scenario)", async () => {
    const invalidProposalId = 9999; // Non-existent proposal ID
    const vote = true;
    const voteOnProposalIx = new web3.TransactionInstruction({
      programId: pg.PROGRAM_ID,
      keys: [
        { pubkey: stakingPoolKp.publicKey, isSigner: false, isWritable: true },
        { pubkey: pg.wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([
        Buffer.from(Uint8Array.of(6)), // Instruction enum index for VoteOnProposal
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(invalidProposalId)]).buffer)), // Invalid proposal ID
        Buffer.from([vote ? 1 : 0]), // Vote
      ]),
    });

    try {
      const tx = new web3.Transaction().add(voteOnProposalIx);
      await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);
      assert.fail("The transaction should have failed");
    } catch (err) {
      assert(err.message.includes("Transaction simulation failed"), "Expected transaction failure");
    }
  });
});

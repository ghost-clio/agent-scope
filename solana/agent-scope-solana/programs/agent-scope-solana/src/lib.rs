use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;
declare_id!("7K6qSQKWBh3sNzAnQADJMcGvAx6zMALGnPvhxhFoV8GK");

/// SPL Token program ID
const SPL_TOKEN_ID: Pubkey = Pubkey::new_from_array([
    6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172,
    28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169,
]);

/// SPL Token transfer discriminator (first byte of instruction data)
const SPL_TRANSFER: u8 = 3;
/// SPL Token approve discriminator
const SPL_APPROVE: u8 = 4;
/// SPL Token transferChecked discriminator
const SPL_TRANSFER_CHECKED: u8 = 12;

/// AgentScope for Solana — on-chain spending policies for AI agent wallets.
/// Same protocol (ASP-1), native Solana implementation.
///
/// Features (parity with EVM version):
/// - PDA vault with SOL spend limits (daily + per-tx)
/// - Program whitelists (contract whitelists in EVM)
/// - Instruction discriminator filtering (function selectors in EVM)
/// - SPL token allowances (ERC20 limits in EVM)
/// - CPI execution (executeAsAgent in EVM)
/// - Session expiry, emergency pause, revocation
/// - Agent-to-agent scope verification
/// - Self-targeting protection
#[program]
pub mod agent_scope_solana {
    use super::*;

    /// Initialize a new vault with the owner (human) as authority.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.paused = false;
        vault.bump = ctx.bumps.vault;
        msg!("Vault initialized. Owner: {}", vault.owner);
        Ok(())
    }

    /// Fund the vault with SOL.
    pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.funder.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;
        msg!("Vault funded with {} lamports", amount);
        Ok(())
    }

    /// Set an agent's policy (called by vault owner).
    pub fn set_agent_policy(
        ctx: Context<SetAgentPolicy>,
        daily_limit_lamports: u64,
        per_tx_limit_lamports: u64,
        session_expiry: i64,
        allowed_programs: Vec<Pubkey>,
        allowed_discriminators: Vec<[u8; 8]>,
    ) -> Result<()> {
        require!(allowed_programs.len() <= 10, AgentScopeError::TooManyPrograms);
        require!(allowed_discriminators.len() <= 10, AgentScopeError::TooManyDiscriminators);

        let policy = &mut ctx.accounts.policy;
        policy.vault = ctx.accounts.vault.key();
        policy.agent = ctx.accounts.agent.key();
        policy.daily_limit_lamports = daily_limit_lamports;
        policy.per_tx_limit_lamports = per_tx_limit_lamports;
        policy.session_expiry = session_expiry;
        policy.allowed_programs = allowed_programs.clone();
        policy.allowed_discriminators = allowed_discriminators.clone();
        policy.daily_spent = 0;
        policy.last_reset = Clock::get()?.unix_timestamp;
        policy.active = true;
        policy.bump = ctx.bumps.policy;

        emit!(PolicySet {
            vault: policy.vault,
            agent: policy.agent,
            daily_limit: daily_limit_lamports,
            per_tx_limit: per_tx_limit_lamports,
            expiry: session_expiry,
            num_programs: allowed_programs.len() as u8,
        });

        msg!(
            "Policy set for agent {}. Daily limit: {} lamports",
            policy.agent,
            daily_limit_lamports
        );
        Ok(())
    }

    /// Set SPL token allowance for an agent (called by vault owner).
    /// Equivalent to setTokenAllowance() in the EVM contract.
    pub fn set_token_allowance(
        ctx: Context<SetTokenAllowance>,
        token_mint: Pubkey,
        daily_limit: u64,
    ) -> Result<()> {
        let allowance = &mut ctx.accounts.token_allowance;
        allowance.vault = ctx.accounts.vault.key();
        allowance.agent = ctx.accounts.policy.agent;
        allowance.token_mint = token_mint;
        allowance.daily_limit = daily_limit;
        allowance.daily_spent = 0;
        allowance.last_reset = Clock::get()?.unix_timestamp;
        allowance.bump = ctx.bumps.token_allowance;

        emit!(TokenAllowanceSet {
            vault: allowance.vault,
            agent: allowance.agent,
            token_mint,
            daily_limit,
        });

        msg!(
            "Token allowance set: agent={}, mint={}, limit={}",
            allowance.agent, token_mint, daily_limit
        );
        Ok(())
    }

    /// Agent executes a SOL transfer within policy constraints.
    pub fn execute_transfer(ctx: Context<ExecuteTransfer>, amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let policy = &mut ctx.accounts.policy;

        // Run all policy checks
        enforce_policy(vault, policy, amount)?;

        // Self-targeting protection: can't send SOL back to vault
        require!(
            ctx.accounts.recipient.key() != vault.key(),
            AgentScopeError::CannotTargetVault
        );

        // Execute transfer from vault PDA
        let vault_lamports = vault.to_account_info().lamports();
        require!(vault_lamports >= amount, AgentScopeError::InsufficientFunds);

        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;

        // Track spend
        policy.daily_spent = policy.daily_spent.checked_add(amount).ok_or(AgentScopeError::DailyLimitExceeded)?;

        emit!(Execution {
            vault: vault.key(),
            agent: policy.agent,
            recipient: ctx.accounts.recipient.key(),
            amount,
            daily_spent: policy.daily_spent,
            daily_limit: policy.daily_limit_lamports,
        });

        msg!(
            "Transfer executed: {} lamports to {}. Daily: {}/{}",
            amount,
            ctx.accounts.recipient.key(),
            policy.daily_spent,
            policy.daily_limit_lamports
        );
        Ok(())
    }

    /// Agent executes a CPI call through the vault within policy constraints.
    /// Equivalent to executeAsAgent() in the EVM contract.
    /// The vault PDA signs as authority for the CPI call.
    pub fn execute_cpi(
        ctx: Context<ExecuteCpi>,
        target_program: Pubkey,
        instruction_data: Vec<u8>,
        sol_amount: u64,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let policy = &mut ctx.accounts.policy;

        // Run all policy checks (SOL amount)
        enforce_policy(vault, policy, sol_amount)?;

        // Self-targeting protection
        require!(
            target_program != crate::ID,
            AgentScopeError::CannotTargetVault
        );

        // Check program whitelist
        if !policy.allowed_programs.is_empty() {
            require!(
                policy.allowed_programs.contains(&target_program),
                AgentScopeError::ProgramNotAllowed
            );
        }

        // Check instruction discriminator (first 8 bytes)
        if !policy.allowed_discriminators.is_empty() && instruction_data.len() >= 8 {
            let mut disc = [0u8; 8];
            disc.copy_from_slice(&instruction_data[..8]);
            require!(
                policy.allowed_discriminators.contains(&disc),
                AgentScopeError::InstructionNotAllowed
            );
        }

        // Check if this is an SPL token operation and enforce token limits
        if target_program == SPL_TOKEN_ID && !instruction_data.is_empty() {
            let ix_type = instruction_data[0];
            if ix_type == SPL_TRANSFER || ix_type == SPL_APPROVE || ix_type == SPL_TRANSFER_CHECKED {
                if instruction_data.len() >= 9 {
                    let token_amount = u64::from_le_bytes(
                        instruction_data[1..9].try_into().unwrap()
                    );

                    // Token allowance enforcement: first remaining_account must be
                    // the TokenAllowance PDA. Validate it's the correct PDA before reading.
                    if let Some(token_allowance_info) = ctx.remaining_accounts.first() {
                        // Validate PDA ownership and derivation
                        require!(
                            token_allowance_info.owner == &crate::ID,
                            AgentScopeError::InvalidTokenAllowance
                        );

                        // Extract the mint from the account data (offset 72 = 8 disc + 32 vault + 32 agent)
                        let data_ref = token_allowance_info.try_borrow_data()?;
                        if data_ref.len() >= 104 {
                            let stored_vault = Pubkey::try_from(&data_ref[8..40]).unwrap();
                            let stored_agent = Pubkey::try_from(&data_ref[40..72]).unwrap();
                            require!(
                                stored_vault == vault.key() && stored_agent == policy.agent,
                                AgentScopeError::InvalidTokenAllowance
                            );
                        }
                        drop(data_ref);

                        let mut data = token_allowance_info.try_borrow_mut_data()?;
                        // Skip 8-byte discriminator + 32 vault + 32 agent + 32 mint = offset 104
                        // daily_limit: u64 at 104, daily_spent: u64 at 112, last_reset: i64 at 120
                        if data.len() >= 129 {
                            let daily_limit = u64::from_le_bytes(data[104..112].try_into().unwrap());
                            let mut daily_spent = u64::from_le_bytes(data[112..120].try_into().unwrap());
                            let last_reset = i64::from_le_bytes(data[120..128].try_into().unwrap());

                            let clock = Clock::get()?;
                            if clock.unix_timestamp - last_reset >= 86400 {
                                daily_spent = 0;
                                data[120..128].copy_from_slice(&clock.unix_timestamp.to_le_bytes());
                            }

                            if daily_limit > 0 {
                                require!(
                                    daily_spent.checked_add(token_amount).ok_or(AgentScopeError::TokenLimitExceeded)? <= daily_limit,
                                    AgentScopeError::TokenLimitExceeded
                                );
                                daily_spent = daily_spent.checked_add(token_amount).ok_or(AgentScopeError::TokenLimitExceeded)?;
                                data[112..120].copy_from_slice(&daily_spent.to_le_bytes());
                            }
                        }
                    }

                    emit!(TokenSpend {
                        vault: vault.key(),
                        agent: policy.agent,
                        token_amount,
                    });
                }
            }
        }

        // Build the CPI instruction
        let account_metas: Vec<AccountMeta> = ctx.remaining_accounts.iter().skip(1).map(|a| {
            if a.is_writable {
                AccountMeta::new(*a.key, a.is_signer)
            } else {
                AccountMeta::new_readonly(*a.key, a.is_signer)
            }
        }).collect();

        let ix = Instruction {
            program_id: target_program,
            accounts: account_metas,
            data: instruction_data,
        };

        // Vault PDA signs
        let owner_key = vault.owner.key();
        let seeds = &[
            b"vault",
            owner_key.as_ref(),
            &[vault.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Collect remaining account infos for CPI (skip first which is token_allowance)
        let cpi_accounts: Vec<AccountInfo> = ctx.remaining_accounts.iter()
            .skip(1)
            .cloned()
            .collect();

        invoke_signed(&ix, &cpi_accounts, signer_seeds)?;

        // Track SOL spend
        if sol_amount > 0 {
            policy.daily_spent = policy.daily_spent.checked_add(sol_amount).ok_or(AgentScopeError::DailyLimitExceeded)?;
        }

        emit!(CpiExecution {
            vault: vault.key(),
            agent: policy.agent,
            target_program,
            sol_amount,
            daily_spent: policy.daily_spent,
        });

        msg!(
            "CPI executed: program={}, sol_amount={}. Daily: {}/{}",
            target_program,
            sol_amount,
            policy.daily_spent,
            policy.daily_limit_lamports
        );
        Ok(())
    }

    /// Check if a transaction would be allowed (view-like, doesn't execute).
    pub fn check_permission(
        ctx: Context<CheckPermission>,
        amount: u64,
        target_program: Pubkey,
        discriminator: [u8; 8],
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let policy = &ctx.accounts.policy;
        let clock = Clock::get()?;

        require!(!vault.paused, AgentScopeError::ModulePaused);
        require!(policy.active, AgentScopeError::PolicyInactive);

        if policy.session_expiry > 0 {
            require!(
                clock.unix_timestamp < policy.session_expiry,
                AgentScopeError::SessionExpired
            );
        }

        // Check daily (accounting for possible reset)
        let mut effective_spent = policy.daily_spent;
        if clock.unix_timestamp - policy.last_reset >= 86400 {
            effective_spent = 0;
        }

        if policy.per_tx_limit_lamports > 0 {
            require!(
                amount <= policy.per_tx_limit_lamports,
                AgentScopeError::PerTxLimitExceeded
            );
        }

        require!(
            effective_spent.checked_add(amount).ok_or(AgentScopeError::DailyLimitExceeded)? <= policy.daily_limit_lamports,
            AgentScopeError::DailyLimitExceeded
        );

        // Check program whitelist (empty = allow all)
        if !policy.allowed_programs.is_empty() {
            require!(
                policy.allowed_programs.contains(&target_program),
                AgentScopeError::ProgramNotAllowed
            );
        }

        // Check discriminator whitelist (empty = allow all)
        if !policy.allowed_discriminators.is_empty() {
            require!(
                policy.allowed_discriminators.contains(&discriminator),
                AgentScopeError::InstructionNotAllowed
            );
        }

        msg!("Permission check PASSED for {} lamports", amount);
        Ok(())
    }

    /// Get agent scope (for agent-to-agent verification).
    pub fn get_agent_scope(ctx: Context<GetAgentScope>) -> Result<()> {
        let policy = &ctx.accounts.policy;
        let vault = &ctx.accounts.vault;
        let clock = Clock::get()?;

        let mut remaining = policy.daily_limit_lamports.saturating_sub(policy.daily_spent);
        if clock.unix_timestamp - policy.last_reset >= 86400 {
            remaining = policy.daily_limit_lamports;
        }

        emit!(ScopeQueried {
            vault: vault.key(),
            agent: policy.agent,
            active: policy.active && !vault.paused,
            daily_limit: policy.daily_limit_lamports,
            remaining,
            expiry: policy.session_expiry,
            num_programs: policy.allowed_programs.len() as u8,
            num_discriminators: policy.allowed_discriminators.len() as u8,
        });

        msg!(
            "Scope: active={}, remaining={}/{}, expiry={}, programs={}, discs={}",
            policy.active && !vault.paused,
            remaining,
            policy.daily_limit_lamports,
            policy.session_expiry,
            policy.allowed_programs.len(),
            policy.allowed_discriminators.len()
        );
        Ok(())
    }

    /// Emergency pause — freezes all agent execution (owner only).
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.vault.paused = paused;

        emit!(PauseToggled {
            vault: ctx.accounts.vault.key(),
            paused,
        });

        msg!("Vault paused: {}", paused);
        Ok(())
    }

    /// Revoke an agent's policy (owner only).
    pub fn revoke_agent(ctx: Context<RevokeAgent>) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        policy.active = false;

        emit!(AgentRevoked {
            vault: ctx.accounts.vault.key(),
            agent: policy.agent,
        });

        msg!("Agent {} revoked", policy.agent);
        Ok(())
    }

    /// Update policy without resetting spend tracking (owner only).
    /// Allows modifying limits/whitelist mid-session.
    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        daily_limit_lamports: u64,
        per_tx_limit_lamports: u64,
        session_expiry: i64,
        allowed_programs: Vec<Pubkey>,
        allowed_discriminators: Vec<[u8; 8]>,
    ) -> Result<()> {
        require!(allowed_programs.len() <= 10, AgentScopeError::TooManyPrograms);
        require!(allowed_discriminators.len() <= 10, AgentScopeError::TooManyDiscriminators);

        let policy = &mut ctx.accounts.policy;
        policy.daily_limit_lamports = daily_limit_lamports;
        policy.per_tx_limit_lamports = per_tx_limit_lamports;
        policy.session_expiry = session_expiry;
        policy.allowed_programs = allowed_programs;
        policy.allowed_discriminators = allowed_discriminators;
        // Note: daily_spent and last_reset are NOT reset

        emit!(PolicyUpdated {
            vault: policy.vault,
            agent: policy.agent,
            daily_limit: daily_limit_lamports,
            per_tx_limit: per_tx_limit_lamports,
            expiry: session_expiry,
        });

        msg!("Policy updated for agent {}", policy.agent);
        Ok(())
    }
}

// ═══════════════════════════════════════════════
//  SHARED ENFORCEMENT LOGIC
// ═══════════════════════════════════════════════

/// Core policy enforcement — called by both execute_transfer and execute_cpi.
fn enforce_policy(vault: &Vault, policy: &mut AgentPolicy, amount: u64) -> Result<()> {
    let clock = Clock::get()?;

    // Check: not paused
    require!(!vault.paused, AgentScopeError::ModulePaused);

    // Check: policy active
    require!(policy.active, AgentScopeError::PolicyInactive);

    // Check: session not expired
    if policy.session_expiry > 0 {
        require!(
            clock.unix_timestamp < policy.session_expiry,
            AgentScopeError::SessionExpired
        );
    }

    // Reset daily window if needed (24h = 86400 seconds)
    if clock.unix_timestamp - policy.last_reset >= 86400 {
        policy.daily_spent = 0;
        policy.last_reset = clock.unix_timestamp;
    }

    // Check: per-tx limit
    if policy.per_tx_limit_lamports > 0 {
        require!(
            amount <= policy.per_tx_limit_lamports,
            AgentScopeError::PerTxLimitExceeded
        );
    }

    // Check: daily limit
    require!(
        policy.daily_spent.checked_add(amount).ok_or(AgentScopeError::DailyLimitExceeded)? <= policy.daily_limit_lamports,
        AgentScopeError::DailyLimitExceeded
    );

    Ok(())
}

// ═══════════════════════════════════════════════
//  ACCOUNTS
// ═══════════════════════════════════════════════

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub paused: bool,
    pub bump: u8,
}

impl Vault {
    pub const SIZE: usize = 8 + 32 + 1 + 1;
}

#[account]
pub struct AgentPolicy {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub daily_limit_lamports: u64,
    pub per_tx_limit_lamports: u64,
    pub session_expiry: i64,
    pub allowed_programs: Vec<Pubkey>,
    pub allowed_discriminators: Vec<[u8; 8]>,
    pub daily_spent: u64,
    pub last_reset: i64,
    pub active: bool,
    pub bump: u8,
}

impl AgentPolicy {
    pub const SIZE: usize = 8
        + 32    // vault
        + 32    // agent
        + 8     // daily_limit
        + 8     // per_tx_limit
        + 8     // session_expiry
        + 4 + (32 * 10)  // allowed_programs
        + 4 + (8 * 10)   // allowed_discriminators
        + 8     // daily_spent
        + 8     // last_reset
        + 1     // active
        + 1;    // bump
}

#[account]
pub struct TokenAllowance {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub token_mint: Pubkey,
    pub daily_limit: u64,
    pub daily_spent: u64,
    pub last_reset: i64,
    pub bump: u8,
}

impl TokenAllowance {
    pub const SIZE: usize = 8
        + 32    // vault
        + 32    // agent
        + 32    // token_mint
        + 8     // daily_limit
        + 8     // daily_spent
        + 8     // last_reset
        + 1;    // bump
}

// ═══════════════════════════════════════════════
//  INSTRUCTION CONTEXTS
// ═══════════════════════════════════════════════

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = Vault::SIZE,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetAgentPolicy<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init_if_needed,
        payer = owner,
        space = AgentPolicy::SIZE,
        seeds = [b"policy", vault.key().as_ref(), agent.key().as_ref()],
        bump,
    )]
    pub policy: Account<'info, AgentPolicy>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: Agent is just a pubkey, doesn't need to sign
    pub agent: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_mint: Pubkey)]
pub struct SetTokenAllowance<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        seeds = [b"policy", vault.key().as_ref(), policy.agent.as_ref()],
        bump = policy.bump,
        has_one = vault,
    )]
    pub policy: Account<'info, AgentPolicy>,
    #[account(
        init_if_needed,
        payer = owner,
        space = TokenAllowance::SIZE,
        seeds = [
            b"token_allowance",
            vault.key().as_ref(),
            policy.agent.as_ref(),
            token_mint.as_ref(),
        ],
        bump,
    )]
    pub token_allowance: Account<'info, TokenAllowance>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTransfer<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [b"policy", vault.key().as_ref(), agent.key().as_ref()],
        bump = policy.bump,
        has_one = vault,
        has_one = agent,
    )]
    pub policy: Account<'info, AgentPolicy>,
    pub agent: Signer<'info>,
    /// CHECK: Recipient can be any account
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteCpi<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [b"policy", vault.key().as_ref(), agent.key().as_ref()],
        bump = policy.bump,
        has_one = vault,
        has_one = agent,
    )]
    pub policy: Account<'info, AgentPolicy>,
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckPermission<'info> {
    #[account(
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        seeds = [b"policy", vault.key().as_ref(), agent.key().as_ref()],
        bump = policy.bump,
        has_one = vault,
    )]
    pub policy: Account<'info, AgentPolicy>,
    /// CHECK: Agent pubkey for lookup
    pub agent: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct GetAgentScope<'info> {
    #[account(
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        seeds = [b"policy", vault.key().as_ref(), agent.key().as_ref()],
        bump = policy.bump,
        has_one = vault,
    )]
    pub policy: Account<'info, AgentPolicy>,
    /// CHECK: Agent pubkey for lookup
    pub agent: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevokeAgent<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [b"policy", vault.key().as_ref(), policy.agent.as_ref()],
        bump = policy.bump,
        has_one = vault,
    )]
    pub policy: Account<'info, AgentPolicy>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [b"policy", vault.key().as_ref(), policy.agent.as_ref()],
        bump = policy.bump,
        has_one = vault,
    )]
    pub policy: Account<'info, AgentPolicy>,
    pub owner: Signer<'info>,
}

// ═══════════════════════════════════════════════
//  EVENTS
// ═══════════════════════════════════════════════

#[event]
pub struct PolicySet {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub daily_limit: u64,
    pub per_tx_limit: u64,
    pub expiry: i64,
    pub num_programs: u8,
}

#[event]
pub struct PolicyUpdated {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub daily_limit: u64,
    pub per_tx_limit: u64,
    pub expiry: i64,
}

#[event]
pub struct TokenAllowanceSet {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub token_mint: Pubkey,
    pub daily_limit: u64,
}

#[event]
pub struct Execution {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub daily_spent: u64,
    pub daily_limit: u64,
}

#[event]
pub struct CpiExecution {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub target_program: Pubkey,
    pub sol_amount: u64,
    pub daily_spent: u64,
}

#[event]
pub struct TokenSpend {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub token_amount: u64,
}

#[event]
pub struct ScopeQueried {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub active: bool,
    pub daily_limit: u64,
    pub remaining: u64,
    pub expiry: i64,
    pub num_programs: u8,
    pub num_discriminators: u8,
}

#[event]
pub struct PauseToggled {
    pub vault: Pubkey,
    pub paused: bool,
}

#[event]
pub struct AgentRevoked {
    pub vault: Pubkey,
    pub agent: Pubkey,
}

// ═══════════════════════════════════════════════
//  ERRORS
// ═══════════════════════════════════════════════

#[error_code]
pub enum AgentScopeError {
    #[msg("Module is paused")]
    ModulePaused,
    #[msg("Agent policy is not active")]
    PolicyInactive,
    #[msg("Session has expired")]
    SessionExpired,
    #[msg("Daily spend limit exceeded")]
    DailyLimitExceeded,
    #[msg("Per-transaction limit exceeded")]
    PerTxLimitExceeded,
    #[msg("Target program not in whitelist")]
    ProgramNotAllowed,
    #[msg("Instruction discriminator not in whitelist")]
    InstructionNotAllowed,
    #[msg("Insufficient vault funds")]
    InsufficientFunds,
    #[msg("Too many programs in whitelist (max 10)")]
    TooManyPrograms,
    #[msg("Too many discriminators in whitelist (max 10)")]
    TooManyDiscriminators,
    #[msg("Cannot target the vault/program itself")]
    CannotTargetVault,
    #[msg("SPL token daily limit exceeded")]
    TokenLimitExceeded,
    #[msg("Invalid token allowance PDA: wrong owner, vault, or agent")]
    InvalidTokenAllowance,
}

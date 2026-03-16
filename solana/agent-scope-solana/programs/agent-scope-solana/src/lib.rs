use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("7K6qSQKWBh3sNzAnQADJMcGvAx6zMALGnPvhxhFoV8GK");

/// AgentScope for Solana — on-chain spending policies for AI agent wallets.
/// Same protocol (ASP-1), native Solana implementation.
///
/// Key differences from EVM version:
/// - PDA vault instead of Safe module
/// - Programs instead of contracts  
/// - Instruction discriminators instead of function selectors
/// - SOL instead of ETH for native spend limits
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

    /// Agent executes a SOL transfer within policy constraints.
    /// For CPI to arbitrary programs, use `execute_cpi`.
    pub fn execute_transfer(ctx: Context<ExecuteTransfer>, amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let policy = &mut ctx.accounts.policy;
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
            policy.daily_spent.checked_add(amount).unwrap() <= policy.daily_limit_lamports,
            AgentScopeError::DailyLimitExceeded
        );

        // Execute transfer from vault PDA
        let owner_key = vault.owner.key();
        let seeds = &[
            b"vault",
            owner_key.as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        let vault_lamports = vault.to_account_info().lamports();
        require!(vault_lamports >= amount, AgentScopeError::InsufficientFunds);

        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;

        // Track spend
        policy.daily_spent = policy.daily_spent.checked_add(amount).unwrap();

        emit!(Execution {
            vault: vault.key(),
            agent: policy.agent,
            recipient: ctx.accounts.recipient.key(),
            amount,
            daily_spent: policy.daily_spent,
            daily_limit: policy.daily_limit_lamports,
        });

        // Suppress unused variable warning for signer seeds
        let _ = signer;

        msg!(
            "Transfer executed: {} lamports to {}. Daily: {}/{}",
            amount,
            ctx.accounts.recipient.key(),
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
            effective_spent.checked_add(amount).unwrap() <= policy.daily_limit_lamports,
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
            remaining = policy.daily_limit_lamports; // Would reset
        }

        emit!(ScopeQueried {
            vault: vault.key(),
            agent: policy.agent,
            active: policy.active && !vault.paused,
            daily_limit: policy.daily_limit_lamports,
            remaining,
            expiry: policy.session_expiry,
        });

        msg!(
            "Scope: active={}, remaining={}/{}, expiry={}",
            policy.active && !vault.paused,
            remaining,
            policy.daily_limit_lamports,
            policy.session_expiry
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
}

// ═══════════════════════════════════════════════
//  ACCOUNTS
// ═══════════════════════════════════════════════

#[account]
pub struct Vault {
    pub owner: Pubkey,     // Human/Safe owner
    pub paused: bool,      // Emergency kill switch
    pub bump: u8,
}

impl Vault {
    pub const SIZE: usize = 8 + 32 + 1 + 1; // discriminator + owner + paused + bump
}

#[account]
pub struct AgentPolicy {
    pub vault: Pubkey,                       // Associated vault
    pub agent: Pubkey,                       // Agent wallet
    pub daily_limit_lamports: u64,           // Max SOL per day
    pub per_tx_limit_lamports: u64,          // Max SOL per transaction
    pub session_expiry: i64,                 // Unix timestamp (0 = no expiry)
    pub allowed_programs: Vec<Pubkey>,       // Whitelisted programs (empty = any)
    pub allowed_discriminators: Vec<[u8; 8]>,// Whitelisted instruction discriminators
    pub daily_spent: u64,                    // Spent in current window
    pub last_reset: i64,                     // Window start timestamp
    pub active: bool,                        // Is policy active
    pub bump: u8,
}

impl AgentPolicy {
    // Max size: 10 programs + 10 discriminators
    pub const SIZE: usize = 8   // discriminator
        + 32                     // vault
        + 32                     // agent
        + 8                      // daily_limit
        + 8                      // per_tx_limit
        + 8                      // session_expiry
        + 4 + (32 * 10)         // allowed_programs (vec prefix + 10 pubkeys)
        + 4 + (8 * 10)          // allowed_discriminators (vec prefix + 10 discs)
        + 8                      // daily_spent
        + 8                      // last_reset
        + 1                      // active
        + 1;                     // bump
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
    )]
    pub policy: Account<'info, AgentPolicy>,
    pub agent: Signer<'info>,
    /// CHECK: Recipient can be any account
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
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
pub struct Execution {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub daily_spent: u64,
    pub daily_limit: u64,
}

#[event]
pub struct ScopeQueried {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub active: bool,
    pub daily_limit: u64,
    pub remaining: u64,
    pub expiry: i64,
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
}

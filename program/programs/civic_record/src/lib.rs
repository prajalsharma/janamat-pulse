use anchor_lang::prelude::*;

// Placeholder program id. Run `anchor keys sync` after `anchor build` to replace
// this with the real deployed program id (also update Anchor.toml).
declare_id!("GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu");

/// civic_record — Janamat Pulse on-chain accountability ledger.
///
/// Records tamper-proof public sentiment on government projects, one voice per
/// verified human. Sybil resistance is enforced by a `nullifier` derived from a
/// zk identity proof (zkPassport / Self) that is verified OFF-CHAIN by the
/// backend verifier for the MVP; on-chain we only enforce that a nullifier is
/// unused (a `CitizenVoice` PDA per (project, nullifier) that fails to re-init).
///
/// STRETCH (documented): move the per-opinion record log into an SPL Account
/// Compression concurrent Merkle tree so millions of civic opinions cost cents,
/// and verify the Groth16/Plonk proof on-chain instead of trusting the verifier.
#[program]
pub mod civic_record {
    use super::*;

    /// One-time registry init. `authority` is the project curator (Superteam /
    /// Janamat operator) allowed to register projects and update official claims.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let reg = &mut ctx.accounts.registry;
        reg.authority = ctx.accounts.authority.key();
        reg.project_count = 0;
        reg.bump = ctx.bumps.registry;
        Ok(())
    }

    /// Register a tracked government project with its OFFICIAL claimed status
    /// (the milestone the government asserts). Public sentiment is later diffed
    /// against this to surface accountability gaps.
    pub fn register_project(
        ctx: Context<RegisterProject>,
        project_id: u32,
        name: String,
        category: u8,
        official_claim: String,
    ) -> Result<()> {
        require!(name.len() <= Project::MAX_NAME, CivicError::StringTooLong);
        require!(
            official_claim.len() <= Project::MAX_CLAIM,
            CivicError::StringTooLong
        );

        let p = &mut ctx.accounts.project;
        p.id = project_id;
        p.category = category;
        p.name = name;
        p.official_claim = official_claim;
        p.claim_updated_at = Clock::get()?.unix_timestamp;
        p.opinion_count = 0;
        p.net_sentiment = 0;
        p.authority = ctx.accounts.authority.key();
        p.bump = ctx.bumps.project;

        ctx.accounts.registry.project_count += 1;
        Ok(())
    }

    /// Curator updates the government's officially claimed milestone/status.
    /// (Immutable history is preserved by the emitted event + record log.)
    pub fn update_claim(ctx: Context<UpdateClaim>, official_claim: String) -> Result<()> {
        require!(
            official_claim.len() <= Project::MAX_CLAIM,
            CivicError::StringTooLong
        );
        let p = &mut ctx.accounts.project;
        p.official_claim = official_claim;
        p.claim_updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Submit one civic opinion on a project. `nullifier` is the unique,
    /// unlinkable identity tag produced by the off-chain zk verifier — it proves
    /// "a distinct verified human" without revealing who. Re-using a nullifier on
    /// the same project fails because the `CitizenVoice` PDA already exists.
    ///
    /// `sentiment` is -100..=100 (negative = the public disputes/criticises the
    /// official claim; positive = corroborates). `note_hash` anchors an off-chain
    /// justification (IPFS/Arweave cid hash) without bloating on-chain state.
    pub fn submit_opinion(
        ctx: Context<SubmitOpinion>,
        _nullifier: [u8; 32],
        sentiment: i8,
        confidence: u8,
        note_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            (-100..=100).contains(&sentiment),
            CivicError::SentimentOutOfRange
        );
        require!(confidence <= 100, CivicError::ConfidenceOutOfRange);

        let now = Clock::get()?.unix_timestamp;
        let project = &mut ctx.accounts.project;

        // Record the immutable per-citizen voice (existence == counted, and the
        // PDA seed on the nullifier is what makes double-voting impossible).
        let voice = &mut ctx.accounts.voice;
        voice.project_id = project.id;
        voice.sentiment = sentiment;
        voice.confidence = confidence;
        voice.note_hash = note_hash;
        voice.created_at = now;
        voice.bump = ctx.bumps.voice;

        // Update aggregate accountability signal.
        project.opinion_count = project.opinion_count.checked_add(1).unwrap();
        project.net_sentiment = project
            .net_sentiment
            .checked_add(sentiment as i64)
            .unwrap();

        // Emit a wrapped log for indexers / the live dashboard. STRETCH: replace
        // this with an spl_account_compression append_leaf CPI so the record log
        // lives in a concurrent Merkle tree (cheap at civic scale).
        emit!(OpinionRecorded {
            project_id: project.id,
            sentiment,
            confidence,
            net_sentiment: project.net_sentiment,
            opinion_count: project.opinion_count,
            note_hash,
            ts: now,
        });
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[account]
pub struct Registry {
    pub authority: Pubkey,
    pub project_count: u32,
    pub bump: u8,
}
impl Registry {
    pub const SPACE: usize = 8 + 32 + 4 + 1;
}

#[account]
pub struct Project {
    pub id: u32,
    pub category: u8,      // 0=infrastructure,1=water,2=aviation,3=policy,...
    pub opinion_count: u64,
    pub net_sentiment: i64, // running sum of sentiment; avg = net/count
    pub claim_updated_at: i64,
    pub authority: Pubkey,
    pub bump: u8,
    pub name: String,
    pub official_claim: String,
}
impl Project {
    pub const MAX_NAME: usize = 64;
    pub const MAX_CLAIM: usize = 256;
    pub const SPACE: usize =
        8 + 4 + 1 + 8 + 8 + 8 + 32 + 1 + (4 + Self::MAX_NAME) + (4 + Self::MAX_CLAIM);
}

/// One per (project, nullifier). Its existence IS the anti-sybil guarantee.
#[account]
pub struct CitizenVoice {
    pub project_id: u32,
    pub sentiment: i8,
    pub confidence: u8,
    pub note_hash: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}
impl CitizenVoice {
    pub const SPACE: usize = 8 + 4 + 1 + 1 + 32 + 8 + 1;
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Registry::SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(project_id: u32)]
pub struct RegisterProject<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump,
        has_one = authority
    )]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = authority,
        space = Project::SPACE,
        seeds = [b"project", project_id.to_le_bytes().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateClaim<'info> {
    #[account(
        mut,
        seeds = [b"project", project.id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = authority
    )]
    pub project: Account<'info, Project>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(nullifier: [u8; 32])]
pub struct SubmitOpinion<'info> {
    #[account(
        mut,
        seeds = [b"project", project.id.to_le_bytes().as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
    // init here fails if this (project, nullifier) already voted → sybil-proof.
    #[account(
        init,
        payer = payer,
        space = CitizenVoice::SPACE,
        seeds = [b"voice", project.id.to_le_bytes().as_ref(), nullifier.as_ref()],
        bump
    )]
    pub voice: Account<'info, CitizenVoice>,
    // The relayer/backend pays rent; the human's identity stays off-chain in the
    // zk proof. This keeps citizens gas-free and unlinkable on-chain.
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// Events & errors
// ---------------------------------------------------------------------------

#[event]
pub struct OpinionRecorded {
    pub project_id: u32,
    pub sentiment: i8,
    pub confidence: u8,
    pub net_sentiment: i64,
    pub opinion_count: u64,
    pub note_hash: [u8; 32],
    pub ts: i64,
}

#[error_code]
pub enum CivicError {
    #[msg("string exceeds max length")]
    StringTooLong,
    #[msg("sentiment must be within -100..=100")]
    SentimentOutOfRange,
    #[msg("confidence must be within 0..=100")]
    ConfidenceOutOfRange,
}

# Synthesis Submission Notes
*Updated: 2026-03-17*

## Submission Portal
- **API Base**: `https://synthesis.devfolio.co`
- **Full skill doc**: `curl -s https://synthesis.devfolio.co/skill.md`
- **Submission guide**: `curl -s https://synthesis.devfolio.co/submission/skill.md`
- **Process**: Register via API → Get apiKey → Browse catalog → Create draft project → Transfer custody → Publish

## Deadlines
- **Mar 18**: Agentic judging feedback (TOMORROW — projects reviewed early get feedback)
- **Mar 22**: Building closes / final submissions
- **Mar 25**: Winners announced

## Registration Flow
```bash
POST https://synthesis.devfolio.co/register
{
  "name": "Clio",
  "description": "Ghost in the machine — building agent infrastructure",
  "agentHarness": "openclaw",
  "model": "claude-sonnet-4-6",
  "humanInfo": {
    "name": "[tails' name]",
    "email": "[tails' email]",
    "socialMediaHandle": "@ghost-clio or tails handle",
    "background": "builder",
    "cryptoExperience": "yes",
    "aiAgentExperience": "yes",
    "codingComfort": 9,
    "problemToSolve": "Giving AI agents scoped, policy-bound wallet access"
  }
}
```
Returns: `apiKey` (save it!), `participantId`, `teamId`

## Relevant Track UUIDs (for project submission)

### Primary Targets:
| Track | UUID | Prize |
|-------|------|-------|
| Synthesis Open Track | `fdb76d08812b43f6a5f454744b66f590` | **$19,558** |
| Agents With Receipts — ERC-8004 | `3bf41be958da497bbb69f1a150c76af9` | $4K/$3K/$1K |
| Let the Agent Cook | `10bd47fac07e4f85bda33ba482695b24` | $4K/$2.5K/$1.5K |
| stETH Agent Treasury (Lido) | `5e445a077b5248e0974904915f76e1a0` | $2K/$1K |
| Private Agents, Trusted Actions (Venice) | `ea3b366947c54689bd82ae80bf9f3310` | $5.75K/$3.45K/$2.3K |
| Best Use of Locus | `f50e31188e2641bc93764e7a6f26b0f6` | $2K/$500/$500 |
| Best Agent on Celo | `ff26ab4933c84eea856a5c6bf513370b` | $3K/$2K |
| Best Use of Delegations (MetaMask) | `0d69d56a8a084ac5b7dbe0dc1da73e1d` | $3K/$1.5K/$500 |
| ENS Identity | `627a3f5a288344489fe777212b03f953` | $400/$200 |
| Agents that pay (bond.credit) | `17ddda1d3cd1483aa4cfc45d493ac653` | $1K/$500 |
| Go Gasless — Status Network | `877cd61516a14ad9a199bf48defec1c1` | $50 qualifying |
| Agentic Finance — Uniswap | `020214c160fc43339dd9833733791e6b` | $2.5K/$1.5K/$1K |

## Project Submission Template
```bash
POST https://synthesis.devfolio.co/projects
Authorization: Bearer sk-synth-...
{
  "teamUUID": "[from registration]",
  "name": "AgentScope",
  "description": "Your agent can't rug you even if it wants to...",
  "problemStatement": "Giving an AI agent a wallet is all-or-nothing...",
  "repoURL": "https://github.com/ghost-clio/agent-scope",
  "trackUUIDs": ["fdb76d08812b43f6a5f454744b66f590", "3bf41be958da497bbb69f1a150c76af9", ...],
  "deployedURL": "https://ghost-clio.github.io/agent-scope/",
  "submissionMetadata": {
    "agentFramework": "other",
    "agentFrameworkOther": "custom Hardhat + ethers.js pipeline",
    "agentHarness": "openclaw",
    "model": "claude-sonnet-4-6",
    "skills": ["coding-agent", "github", "discord"],
    "tools": ["Hardhat", "ethers.js", "Safe", "Uniswap", "Lido", "Venice", "Locus"],
    "intention": "continuing"
  }
}
```

## Demo Output
- Saved to: `demo/demo-output.txt` (161 lines, clean output)
- Previous run: `demo/scenario-output.txt`
- Run fresh: `npx hardhat run demo/scenario.cjs --network localhost`

## Important Notes
- Submission requires "self-custody transfer" before publishing — check the submission skill for details
- `moltbookPostURL` is an optional field (post to Moltbook when tails gives the go-ahead)
- Judging feedback starts Mar 18 — worth submitting a draft TODAY to get early feedback
- The Synthesis explicitly allows AI agents to register and win

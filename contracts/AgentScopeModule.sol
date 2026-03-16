// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IExecutor.sol";

/// @title AgentScope — Scoped Wallet Permissions for AI Agents
/// @author clio_ghost
/// @notice A Safe Module that enforces granular spending policies for agent delegates.
///         Humans set the rules. Agents operate within them. The chain enforces both.
/// @dev Attach this module to a Safe, then call setAgentPolicy() to grant scoped permissions
///      to an agent EOA. The agent calls executeAsAgent() to transact through the Safe,
///      subject to all policy constraints.

contract AgentScopeModule {
    // ═══════════════════════════════════════════════════════
    //  TYPES
    // ═══════════════════════════════════════════════════════

    struct Policy {
        bool active;
        uint256 dailySpendLimitWei;    // Max ETH (in wei) per fixed 24h window
        uint256 maxPerTxWei;           // Max ETH per single transaction (0 = use daily limit)
        uint256 sessionExpiry;          // Unix timestamp — permissions die after this
    }

    struct SpendState {
        uint256 spent;                  // Wei spent in current window
        uint256 windowStart;            // Start of current fixed 24h window
    }

    // ═══════════════════════════════════════════════════════
    //  STORAGE
    // ═══════════════════════════════════════════════════════

    /// @notice The Safe this module is attached to
    address public immutable safe;

    /// @notice Global pause — kills all agent execution instantly
    bool public paused;

    /// @notice Reentrancy lock
    uint256 private _locked = 1;

    /// @notice Agent address => their spending policy
    mapping(address => Policy) private _policies;

    /// @notice Agent address => their current spend tracking
    mapping(address => SpendState) private _spendState;

    /// @notice Agent => contract address => whitelisted (O(1) lookup)
    mapping(address => mapping(address => bool)) private _contractWhitelist;

    /// @notice Agent => list of whitelisted contracts (for enumeration/view)
    mapping(address => address[]) private _contractList;

    /// @notice Agent => whether contract whitelist is enabled (empty = any contract allowed)
    mapping(address => bool) private _contractWhitelistEnabled;

    /// @notice Agent => function selector => whitelisted (O(1) lookup)
    mapping(address => mapping(bytes4 => bool)) private _functionWhitelist;

    /// @notice Agent => list of whitelisted selectors (for enumeration/view)
    mapping(address => bytes4[]) private _functionList;

    /// @notice Agent => whether function whitelist is enabled
    mapping(address => bool) private _functionWhitelistEnabled;

    /// @notice Agent address => token address => daily allowance in token units
    mapping(address => mapping(address => uint256)) public tokenAllowances;

    /// @notice Agent address => token address => spent in current window
    mapping(address => mapping(address => uint256)) public tokenSpent;

    /// @notice Agent address => token address => window start
    mapping(address => mapping(address => uint256)) public tokenWindowStart;

    // ═══════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════

    event AgentPolicySet(address indexed agent, uint256 dailyLimit, uint256 maxPerTx, uint256 expiry);
    event AgentExecuted(address indexed agent, address indexed to, uint256 value, bytes4 selector);
    event AgentRevoked(address indexed agent);
    event TokenAllowanceSet(address indexed agent, address indexed token, uint256 dailyAllowance);
    event GlobalPause(bool paused);

    // ═══════════════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════════════

    error NotSafe();
    error AgentNotActive();
    error SessionExpired();
    error DailyLimitExceeded(uint256 requested, uint256 remaining);
    error PerTxLimitExceeded(uint256 requested, uint256 maxPerTx);
    error ContractNotWhitelisted(address target);
    error FunctionNotWhitelisted(bytes4 selector);
    error ExecutionFailed();
    error TokenLimitExceeded(address token, uint256 requested, uint256 remaining);
    error CannotTargetModule();
    error ModulePaused();
    error ReentrancyGuard();

    // ═══════════════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════════════

    modifier onlySafe() {
        if (msg.sender != safe) revert NotSafe();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ModulePaused();
        _;
    }

    /// @dev Prevents reentrancy. Lighter than OZ's ReentrancyGuard.
    modifier nonReentrant() {
        if (_locked == 2) revert ReentrancyGuard();
        _locked = 2;
        _;
        _locked = 1;
    }

    // ═══════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════

    /// @param _safe The Safe this module serves
    constructor(address _safe) {
        require(_safe != address(0), "zero address");
        safe = _safe;
    }

    // ═══════════════════════════════════════════════════════
    //  OWNER FUNCTIONS (called through Safe)
    // ═══════════════════════════════════════════════════════

    /// @notice Set or update an agent's spending policy
    /// @param agent The agent EOA to authorize
    /// @param dailySpendLimitWei Max ETH per fixed 24h window in wei
    /// @param maxPerTxWei Max ETH per single transaction (0 = no per-tx limit, uses daily limit)
    /// @param sessionExpiry Unix timestamp when permissions expire (0 = no expiry)
    /// @param allowedContracts Whitelist of contract addresses (empty = any contract)
    /// @param allowedFunctions Whitelist of function selectors (empty = any function)
    function setAgentPolicy(
        address agent,
        uint256 dailySpendLimitWei,
        uint256 maxPerTxWei,
        uint256 sessionExpiry,
        address[] calldata allowedContracts,
        bytes4[] calldata allowedFunctions
    ) external onlySafe {
        _policies[agent] = Policy({
            active: true,
            dailySpendLimitWei: dailySpendLimitWei,
            maxPerTxWei: maxPerTxWei,
            sessionExpiry: sessionExpiry
        });

        // ── Clear old whitelists ──
        _clearContractWhitelist(agent);
        _clearFunctionWhitelist(agent);

        // ── Set new contract whitelist ──
        if (allowedContracts.length > 0) {
            _contractWhitelistEnabled[agent] = true;
            for (uint256 i = 0; i < allowedContracts.length; i++) {
                _contractWhitelist[agent][allowedContracts[i]] = true;
            }
            _contractList[agent] = allowedContracts;
        }

        // ── Set new function whitelist ──
        if (allowedFunctions.length > 0) {
            _functionWhitelistEnabled[agent] = true;
            for (uint256 i = 0; i < allowedFunctions.length; i++) {
                _functionWhitelist[agent][allowedFunctions[i]] = true;
            }
            _functionList[agent] = allowedFunctions;
        }

        // Reset spend tracking on policy update
        _spendState[agent] = SpendState({
            spent: 0,
            windowStart: block.timestamp
        });

        emit AgentPolicySet(agent, dailySpendLimitWei, maxPerTxWei, sessionExpiry);
    }

    /// @notice Set a per-token daily allowance for an agent
    /// @param agent The agent EOA
    /// @param token The ERC20 token address
    /// @param dailyAllowance Max tokens per day
    function setTokenAllowance(
        address agent,
        address token,
        uint256 dailyAllowance
    ) external onlySafe {
        tokenAllowances[agent][token] = dailyAllowance;
        tokenSpent[agent][token] = 0;
        tokenWindowStart[agent][token] = block.timestamp;

        emit TokenAllowanceSet(agent, token, dailyAllowance);
    }

    /// @notice Revoke all permissions for an agent
    /// @param agent The agent to revoke
    function revokeAgent(address agent) external onlySafe {
        _policies[agent].active = false;
        _clearContractWhitelist(agent);
        _clearFunctionWhitelist(agent);
        emit AgentRevoked(agent);
    }

    /// @notice Emergency pause — instantly blocks ALL agent execution
    /// @param _paused true to pause, false to unpause
    function setPaused(bool _paused) external onlySafe {
        paused = _paused;
        emit GlobalPause(_paused);
    }

    // ═══════════════════════════════════════════════════════
    //  AGENT FUNCTIONS
    // ═══════════════════════════════════════════════════════

    /// @notice Execute a transaction through the Safe, subject to policy constraints
    /// @dev Protected against reentrancy — external calls happen AFTER all state updates
    /// @param to Target address
    /// @param value ETH value in wei
    /// @param data Calldata for the transaction
    /// @return success Whether execution succeeded
    function executeAsAgent(
        address to,
        uint256 value,
        bytes calldata data
    ) external whenNotPaused nonReentrant returns (bool success) {
        // ── Check 0: Cannot target this module or the Safe (prevents privilege escalation) ──
        if (to == address(this) || to == safe) revert CannotTargetModule();

        Policy storage policy = _policies[msg.sender];

        // ── Check 1: Agent is active ──
        if (!policy.active) revert AgentNotActive();

        // ── Check 2: Session not expired ──
        if (policy.sessionExpiry != 0 && block.timestamp > policy.sessionExpiry) {
            revert SessionExpired();
        }

        // ── Check 3: Contract whitelist (O(1) mapping lookup) ──
        if (_contractWhitelistEnabled[msg.sender]) {
            if (!_contractWhitelist[msg.sender][to]) {
                revert ContractNotWhitelisted(to);
            }
        }

        // ── Check 4: Function selector whitelist (O(1) mapping lookup) ──
        if (data.length >= 4 && _functionWhitelistEnabled[msg.sender]) {
            bytes4 selector = bytes4(data[:4]);
            if (!_functionWhitelist[msg.sender][selector]) {
                revert FunctionNotWhitelisted(selector);
            }
        }

        // ── Check 5: ERC20 token allowance enforcement ──
        if (data.length >= 68) {
            bytes4 selector = bytes4(data[:4]);
            // transfer(address,uint256) = 0xa9059cbb
            // approve(address,uint256)  = 0x095ea7b3
            // transferFrom(address,address,uint256) = 0x23b872dd
            if (selector == 0xa9059cbb || selector == 0x095ea7b3) {
                _enforceTokenLimit(msg.sender, to, abi.decode(data[36:68], (uint256)));
            } else if (selector == 0x23b872dd && data.length >= 100) {
                _enforceTokenLimit(msg.sender, to, abi.decode(data[68:100], (uint256)));
            }
        }

        // ── Check 6: Per-transaction ETH limit ──
        if (value > 0 && policy.maxPerTxWei > 0) {
            if (value > policy.maxPerTxWei) {
                revert PerTxLimitExceeded(value, policy.maxPerTxWei);
            }
        }

        // ── Check 7: Daily ETH spend limit ──
        // State updates happen BEFORE external call (checks-effects-interactions)
        if (value > 0) {
            SpendState storage state = _spendState[msg.sender];

            // Reset window if 24h has passed (fixed window, not rolling)
            if (block.timestamp >= state.windowStart + 24 hours) {
                state.spent = 0;
                state.windowStart = block.timestamp;
            }

            uint256 remaining = policy.dailySpendLimitWei > state.spent ? policy.dailySpendLimitWei - state.spent : 0;
            if (value > remaining) {
                revert DailyLimitExceeded(value, remaining);
            }

            // Effect: update spend BEFORE interaction
            state.spent += value;
        }

        // ── Interaction: Execute through Safe ──
        success = IExecutor(safe).execTransactionFromModule(
            to,
            value,
            data,
            IExecutor.Operation.Call
        );

        if (!success) revert ExecutionFailed();

        bytes4 sel = data.length >= 4 ? bytes4(data[:4]) : bytes4(0);
        emit AgentExecuted(msg.sender, to, value, sel);

        return true;
    }

    // ═══════════════════════════════════════════════════════
    //  INTERNAL
    // ═══════════════════════════════════════════════════════

    /// @dev Enforce token allowance for a given agent and token
    function _enforceTokenLimit(address agent, address token, uint256 amount) internal {
        uint256 allowance = tokenAllowances[agent][token];

        // NOTE: allowance of 0 means unrestricted. Use setTokenAllowance() to limit specific tokens.
        if (allowance == 0) return;

        // Reset window if 24h has passed
        if (block.timestamp >= tokenWindowStart[agent][token] + 24 hours) {
            tokenSpent[agent][token] = 0;
            tokenWindowStart[agent][token] = block.timestamp;
        }

        uint256 tokenRemaining = allowance > tokenSpent[agent][token] ? allowance - tokenSpent[agent][token] : 0;
        if (amount > tokenRemaining) {
            revert TokenLimitExceeded(token, amount, tokenRemaining);
        }

        tokenSpent[agent][token] += amount;
    }

    /// @dev Clear all contract whitelist entries for an agent
    function _clearContractWhitelist(address agent) internal {
        address[] storage list = _contractList[agent];
        for (uint256 i = 0; i < list.length; i++) {
            _contractWhitelist[agent][list[i]] = false;
        }
        delete _contractList[agent];
        _contractWhitelistEnabled[agent] = false;
    }

    /// @dev Clear all function whitelist entries for an agent
    function _clearFunctionWhitelist(address agent) internal {
        bytes4[] storage list = _functionList[agent];
        for (uint256 i = 0; i < list.length; i++) {
            _functionWhitelist[agent][list[i]] = false;
        }
        delete _functionList[agent];
        _functionWhitelistEnabled[agent] = false;
    }

    // ═══════════════════════════════════════════════════════
    //  VIEW FUNCTIONS — Proof of Scope
    // ═══════════════════════════════════════════════════════

    /// @notice Get an agent's current policy on this module.
    /// @dev This proves what the agent can do through THIS Safe only — not a universal identity.
    ///      Other agents can call this on-chain to verify scope before transacting.
    /// @param agent The agent to query
    /// @return active Whether the agent is authorized
    /// @return dailySpendLimitWei Daily ETH limit
    /// @return maxPerTxWei Per-transaction ETH limit (0 = no per-tx limit)
    /// @return sessionExpiry When permissions expire
    /// @return remainingBudget How much ETH the agent can still spend today
    /// @return allowedContracts Whitelisted contract addresses
    /// @return allowedFunctions Whitelisted function selectors
    function getAgentScope(address agent) external view returns (
        bool active,
        uint256 dailySpendLimitWei,
        uint256 maxPerTxWei,
        uint256 sessionExpiry,
        uint256 remainingBudget,
        address[] memory allowedContracts,
        bytes4[] memory allowedFunctions
    ) {
        Policy storage policy = _policies[agent];
        SpendState storage state = _spendState[agent];

        active = policy.active;
        dailySpendLimitWei = policy.dailySpendLimitWei;
        maxPerTxWei = policy.maxPerTxWei;
        sessionExpiry = policy.sessionExpiry;
        allowedContracts = _contractList[agent];
        allowedFunctions = _functionList[agent];

        // Calculate remaining budget (saturating subtraction to prevent underflow)
        if (block.timestamp >= state.windowStart + 24 hours) {
            remainingBudget = policy.dailySpendLimitWei; // Window reset
        } else {
            remainingBudget = policy.dailySpendLimitWei > state.spent ? policy.dailySpendLimitWei - state.spent : 0;
        }
    }

    /// @notice Check if a specific transaction would be allowed under an agent's policy
    /// @param agent The agent
    /// @param to Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @return allowed Whether the transaction would succeed
    /// @return reason If not allowed, the reason why
    function checkPermission(
        address agent,
        address to,
        uint256 value,
        bytes calldata data
    ) external view returns (bool allowed, string memory reason) {
        if (paused) return (false, "module_paused");
        if (to == address(this) || to == safe) return (false, "cannot_target_module");

        Policy storage policy = _policies[agent];

        if (!policy.active) return (false, "agent_not_active");
        if (policy.sessionExpiry != 0 && block.timestamp > policy.sessionExpiry)
            return (false, "session_expired");

        // Contract whitelist check (O(1))
        if (_contractWhitelistEnabled[agent]) {
            if (!_contractWhitelist[agent][to]) return (false, "contract_not_whitelisted");
        }

        // Function selector check (O(1))
        if (data.length >= 4 && _functionWhitelistEnabled[agent]) {
            bytes4 selector = bytes4(data[:4]);
            if (!_functionWhitelist[agent][selector]) return (false, "function_not_whitelisted");
        }

        // Per-tx limit check
        if (value > 0 && policy.maxPerTxWei > 0) {
            if (value > policy.maxPerTxWei) return (false, "per_tx_limit_exceeded");
        }

        // Spend limit check
        if (value > 0) {
            SpendState storage state = _spendState[agent];
            uint256 remaining;
            if (block.timestamp >= state.windowStart + 24 hours) {
                remaining = policy.dailySpendLimitWei;
            } else {
                remaining = policy.dailySpendLimitWei > state.spent ? policy.dailySpendLimitWei - state.spent : 0;
            }
            if (value > remaining) return (false, "daily_limit_exceeded");
        }

        // Token allowance check
        if (data.length >= 68) {
            bytes4 sel = bytes4(data[:4]);
            if (sel == 0xa9059cbb || sel == 0x095ea7b3) {
                uint256 tokenAmount = abi.decode(data[36:68], (uint256));
                uint256 allowance_ = tokenAllowances[agent][to];
                if (allowance_ > 0) {
                    uint256 tSpent = tokenSpent[agent][to];
                    if (block.timestamp >= tokenWindowStart[agent][to] + 24 hours) {
                        tSpent = 0;
                    }
                    uint256 tokenRemaining = allowance_ > tSpent ? allowance_ - tSpent : 0;
                    if (tokenAmount > tokenRemaining) return (false, "token_limit_exceeded");
                }
            } else if (sel == 0x23b872dd && data.length >= 100) {
                uint256 tokenAmount = abi.decode(data[68:100], (uint256));
                uint256 allowance_ = tokenAllowances[agent][to];
                if (allowance_ > 0) {
                    uint256 tSpent = tokenSpent[agent][to];
                    if (block.timestamp >= tokenWindowStart[agent][to] + 24 hours) {
                        tSpent = 0;
                    }
                    uint256 tokenRemaining = allowance_ > tSpent ? allowance_ - tSpent : 0;
                    if (tokenAmount > tokenRemaining) return (false, "token_limit_exceeded");
                }
            }
        }

        return (true, "");
    }
}

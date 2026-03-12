// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IExecutor.sol";

/// @title AgentScope — Scoped Wallet Permissions for AI Agents
/// @author clio_ghost
/// @notice A Gnosis Safe Module that enforces granular spending policies for agent delegates.
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
        uint256 dailySpendLimitWei;    // Max ETH (in wei) per rolling 24h window
        uint256 sessionExpiry;          // Unix timestamp — permissions die after this
        address[] allowedContracts;     // Whitelist of contracts the agent can touch
        bytes4[] allowedFunctions;      // Whitelist of function selectors
    }

    struct SpendState {
        uint256 spent;                  // Wei spent in current window
        uint256 windowStart;            // Start of current 24h window
    }

    // ═══════════════════════════════════════════════════════
    //  STORAGE
    // ═══════════════════════════════════════════════════════

    /// @notice The Safe this module is attached to
    address public immutable safe;

    /// @notice Agent address => their spending policy
    mapping(address => Policy) private _policies;

    /// @notice Agent address => their current spend tracking
    mapping(address => SpendState) private _spendState;

    /// @notice Agent address => token address => daily allowance in token units
    mapping(address => mapping(address => uint256)) public tokenAllowances;

    /// @notice Agent address => token address => spent in current window
    mapping(address => mapping(address => uint256)) public tokenSpent;

    /// @notice Agent address => token address => window start
    mapping(address => mapping(address => uint256)) public tokenWindowStart;

    // ═══════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════

    event AgentPolicySet(address indexed agent, uint256 dailyLimit, uint256 expiry);
    event AgentExecuted(address indexed agent, address indexed to, uint256 value, bytes4 selector);
    event AgentRevoked(address indexed agent);
    event PolicyViolation(address indexed agent, string reason);
    event TokenAllowanceSet(address indexed agent, address indexed token, uint256 dailyAllowance);

    // ═══════════════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════════════

    error NotSafe();
    error AgentNotActive();
    error SessionExpired();
    error DailyLimitExceeded(uint256 requested, uint256 remaining);
    error ContractNotWhitelisted(address target);
    error FunctionNotWhitelisted(bytes4 selector);
    error ExecutionFailed();
    error TokenLimitExceeded(address token, uint256 requested, uint256 remaining);

    // ═══════════════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════════════

    modifier onlySafe() {
        if (msg.sender != safe) revert NotSafe();
        _;
    }

    // ═══════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════

    /// @param _safe The Gnosis Safe this module serves
    constructor(address _safe) {
        safe = _safe;
    }

    // ═══════════════════════════════════════════════════════
    //  OWNER FUNCTIONS (called through Safe)
    // ═══════════════════════════════════════════════════════

    /// @notice Set or update an agent's spending policy
    /// @param agent The agent EOA to authorize
    /// @param dailySpendLimitWei Max ETH per day in wei
    /// @param sessionExpiry Unix timestamp when permissions expire (0 = no expiry)
    /// @param allowedContracts Whitelist of contract addresses (empty = any contract)
    /// @param allowedFunctions Whitelist of function selectors (empty = any function)
    function setAgentPolicy(
        address agent,
        uint256 dailySpendLimitWei,
        uint256 sessionExpiry,
        address[] calldata allowedContracts,
        bytes4[] calldata allowedFunctions
    ) external onlySafe {
        _policies[agent] = Policy({
            active: true,
            dailySpendLimitWei: dailySpendLimitWei,
            sessionExpiry: sessionExpiry,
            allowedContracts: allowedContracts,
            allowedFunctions: allowedFunctions
        });

        // Reset spend tracking on policy update
        _spendState[agent] = SpendState({
            spent: 0,
            windowStart: block.timestamp
        });

        emit AgentPolicySet(agent, dailySpendLimitWei, sessionExpiry);
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
        emit AgentRevoked(agent);
    }

    // ═══════════════════════════════════════════════════════
    //  AGENT FUNCTIONS
    // ═══════════════════════════════════════════════════════

    /// @notice Execute a transaction through the Safe, subject to policy constraints
    /// @param to Target address
    /// @param value ETH value in wei
    /// @param data Calldata for the transaction
    /// @return success Whether execution succeeded
    function executeAsAgent(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bool success) {
        Policy storage policy = _policies[msg.sender];

        // ── Check 1: Agent is active ──
        if (!policy.active) revert AgentNotActive();

        // ── Check 2: Session not expired ──
        if (policy.sessionExpiry != 0 && block.timestamp > policy.sessionExpiry) {
            emit PolicyViolation(msg.sender, "session_expired");
            revert SessionExpired();
        }

        // ── Check 3: Contract whitelist ──
        if (policy.allowedContracts.length > 0) {
            bool allowed = false;
            for (uint256 i = 0; i < policy.allowedContracts.length; i++) {
                if (policy.allowedContracts[i] == to) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) {
                emit PolicyViolation(msg.sender, "contract_not_whitelisted");
                revert ContractNotWhitelisted(to);
            }
        }

        // ── Check 4: Function selector whitelist ──
        if (data.length >= 4 && policy.allowedFunctions.length > 0) {
            bytes4 selector = bytes4(data[:4]);
            bool allowed = false;
            for (uint256 i = 0; i < policy.allowedFunctions.length; i++) {
                if (policy.allowedFunctions[i] == selector) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) {
                emit PolicyViolation(msg.sender, "function_not_whitelisted");
                revert FunctionNotWhitelisted(selector);
            }
        }

        // ── Check 5: Daily ETH spend limit ──
        if (value > 0) {
            SpendState storage state = _spendState[msg.sender];

            // Reset window if 24h has passed
            if (block.timestamp >= state.windowStart + 24 hours) {
                state.spent = 0;
                state.windowStart = block.timestamp;
            }

            uint256 remaining = policy.dailySpendLimitWei - state.spent;
            if (value > remaining) {
                emit PolicyViolation(msg.sender, "daily_limit_exceeded");
                revert DailyLimitExceeded(value, remaining);
            }

            state.spent += value;
        }

        // ── Execute through Safe ──
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
    //  VIEW FUNCTIONS — Portable Proof of Scope
    // ═══════════════════════════════════════════════════════

    /// @notice Get an agent's current policy (other agents can verify scope on-chain)
    /// @param agent The agent to query
    /// @return active Whether the agent is authorized
    /// @return dailySpendLimitWei Daily ETH limit
    /// @return sessionExpiry When permissions expire
    /// @return remainingBudget How much ETH the agent can still spend today
    /// @return allowedContracts Whitelisted contract addresses
    /// @return allowedFunctions Whitelisted function selectors
    function getAgentScope(address agent) external view returns (
        bool active,
        uint256 dailySpendLimitWei,
        uint256 sessionExpiry,
        uint256 remainingBudget,
        address[] memory allowedContracts,
        bytes4[] memory allowedFunctions
    ) {
        Policy storage policy = _policies[agent];
        SpendState storage state = _spendState[agent];

        active = policy.active;
        dailySpendLimitWei = policy.dailySpendLimitWei;
        sessionExpiry = policy.sessionExpiry;
        allowedContracts = policy.allowedContracts;
        allowedFunctions = policy.allowedFunctions;

        // Calculate remaining budget
        if (block.timestamp >= state.windowStart + 24 hours) {
            remainingBudget = policy.dailySpendLimitWei; // Window reset
        } else {
            remainingBudget = policy.dailySpendLimitWei - state.spent;
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
        Policy storage policy = _policies[agent];

        if (!policy.active) return (false, "agent_not_active");
        if (policy.sessionExpiry != 0 && block.timestamp > policy.sessionExpiry)
            return (false, "session_expired");

        // Contract whitelist check
        if (policy.allowedContracts.length > 0) {
            bool found = false;
            for (uint256 i = 0; i < policy.allowedContracts.length; i++) {
                if (policy.allowedContracts[i] == to) { found = true; break; }
            }
            if (!found) return (false, "contract_not_whitelisted");
        }

        // Function selector check
        if (data.length >= 4 && policy.allowedFunctions.length > 0) {
            bytes4 selector = bytes4(data[:4]);
            bool found = false;
            for (uint256 i = 0; i < policy.allowedFunctions.length; i++) {
                if (policy.allowedFunctions[i] == selector) { found = true; break; }
            }
            if (!found) return (false, "function_not_whitelisted");
        }

        // Spend limit check
        if (value > 0) {
            SpendState storage state = _spendState[agent];
            uint256 remaining;
            if (block.timestamp >= state.windowStart + 24 hours) {
                remaining = policy.dailySpendLimitWei;
            } else {
                remaining = policy.dailySpendLimitWei - state.spent;
            }
            if (value > remaining) return (false, "daily_limit_exceeded");
        }

        return (true, "");
    }
}

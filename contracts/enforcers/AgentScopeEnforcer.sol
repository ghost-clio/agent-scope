// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { ICaveatEnforcer, ModeCode } from "./ICaveatEnforcer.sol";

/**
 * @title AgentScopeEnforcer
 * @author clio_ghost (AgentScope)
 * @notice A composite MetaMask Delegation Framework caveat enforcer that
 *         combines ALL AgentScope policy checks into a single enforcer:
 *         - Rolling 24h daily spend limits
 *         - Per-transaction maximums
 *         - Contract address whitelisting
 *         - Function selector whitelisting
 *         - Emergency pause capability
 *
 * @dev This is the "batteries included" enforcer for AI agent delegations.
 *      Instead of composing 4-5 separate enforcers, deploy one AgentScopeEnforcer
 *      and encode all policies in the terms.
 *
 *      Terms encoding:
 *        abi.encode(
 *          uint256 dailyLimitWei,
 *          uint256 maxPerTxWei,
 *          address[] allowedContracts,  // empty = any contract allowed
 *          bytes4[] allowedSelectors    // empty = any function allowed
 *        )
 *
 *      Novel contribution: No existing MetaMask enforcer combines rolling spend
 *      tracking + contract/function whitelisting + pausability in a single
 *      composable unit. This reduces delegation complexity and gas costs for
 *      AI agent use cases.
 */
contract AgentScopeEnforcer is ICaveatEnforcer {
    struct SpendWindow {
        uint256 windowStart;
        uint256 spent;
    }

    struct PauseState {
        bool paused;
        address pausedBy;
        uint256 pausedAt;
    }

    /// @notice The DelegationManager that is authorized to call hooks
    address public immutable delegationManager;

    /// @notice Spend tracking per delegation
    mapping(bytes32 => SpendWindow) public spendWindows;

    /// @notice Pause state per delegator
    mapping(address delegator => PauseState) public pauseStates;

    // ─── Events ──────────────────────────────────────────────────

    event AgentActionEnforced(
        bytes32 indexed delegationHash,
        address indexed redeemer,
        address target,
        uint256 value,
        bytes4 selector
    );
    event DelegationPaused(address indexed delegator, address indexed pausedBy);
    event DelegationUnpaused(address indexed delegator, address indexed unpausedBy);
    event WindowReset(bytes32 indexed delegationHash);

    // ─── Errors ──────────────────────────────────────────────────

    error AgentPaused(address delegator);
    error DailyLimitExceeded(uint256 attempted, uint256 remaining);
    error PerTxLimitExceeded(uint256 amount, uint256 maxPerTx);
    error ContractNotWhitelisted(address target);
    error FunctionNotWhitelisted(bytes4 selector);
    error InvalidTerms();
    error UnauthorizedCaller();

    // ─── Constructor ─────────────────────────────────────────────

    constructor(address _delegationManager) {
        require(_delegationManager != address(0), "zero address");
        delegationManager = _delegationManager;
    }

    // ─── Hooks ───────────────────────────────────────────────────

    function beforeHook(
        bytes calldata _terms,
        bytes calldata,
        ModeCode,
        bytes calldata _executionCalldata,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) external override {
        // 0. Only the DelegationManager can call hooks
        if (msg.sender != delegationManager) revert UnauthorizedCaller();

        // 1. Check pause state
        if (pauseStates[_delegator].paused) {
            revert AgentPaused(_delegator);
        }

        // 2. Decode terms
        (
            uint256 dailyLimit,
            uint256 maxPerTx,
            address[] memory allowedContracts,
            bytes4[] memory allowedSelectors
        ) = _decodeTerms(_terms);

        // 3. Extract execution details
        (address target, uint256 value, bytes4 selector) = _extractExecution(_executionCalldata);

        // 4. Check per-tx limit
        if (maxPerTx > 0 && value > maxPerTx) {
            revert PerTxLimitExceeded(value, maxPerTx);
        }

        // 5. Check contract whitelist
        if (allowedContracts.length > 0) {
            bool found = false;
            for (uint256 i = 0; i < allowedContracts.length; i++) {
                if (allowedContracts[i] == target) {
                    found = true;
                    break;
                }
            }
            if (!found) revert ContractNotWhitelisted(target);
        }

        // 6. Check function selector whitelist
        if (allowedSelectors.length > 0 && selector != bytes4(0)) {
            bool found = false;
            for (uint256 i = 0; i < allowedSelectors.length; i++) {
                if (allowedSelectors[i] == selector) {
                    found = true;
                    break;
                }
            }
            if (!found) revert FunctionNotWhitelisted(selector);
        }

        // 7. Check and update daily spend window
        SpendWindow storage window = spendWindows[_delegationHash];
        if (block.timestamp >= window.windowStart + 24 hours) {
            window.windowStart = block.timestamp;
            window.spent = 0;
            emit WindowReset(_delegationHash);
        }

        uint256 remaining = dailyLimit > window.spent ? dailyLimit - window.spent : 0;
        if (value > remaining) {
            revert DailyLimitExceeded(value, remaining);
        }

        window.spent += value;

        emit AgentActionEnforced(_delegationHash, _redeemer, target, value, selector);
    }

    function beforeAllHook(bytes calldata, bytes calldata, ModeCode, bytes calldata, bytes32, address, address) external override {}
    function afterHook(bytes calldata, bytes calldata, ModeCode, bytes calldata, bytes32, address, address) external override {}
    function afterAllHook(bytes calldata, bytes calldata, ModeCode, bytes calldata, bytes32, address, address) external override {}

    // ─── Pause Controls ──────────────────────────────────────────

    /// @notice Emergency pause — delegator can pause all their agent delegations
    /// @dev Called directly by the delegator (not through delegation)
    function pause() external {
        pauseStates[msg.sender] = PauseState({
            paused: true,
            pausedBy: msg.sender,
            pausedAt: block.timestamp
        });
        emit DelegationPaused(msg.sender, msg.sender);
    }

    /// @notice Unpause agent delegations
    function unpause() external {
        require(pauseStates[msg.sender].paused, "not paused");
        delete pauseStates[msg.sender];
        emit DelegationUnpaused(msg.sender, msg.sender);
    }

    // ─── View Functions ──────────────────────────────────────────

    function getRemainingBudget(bytes32 _delegationHash, uint256 _dailyLimit)
        external view returns (uint256)
    {
        SpendWindow storage window = spendWindows[_delegationHash];
        if (block.timestamp >= window.windowStart + 24 hours) return _dailyLimit;
        return _dailyLimit > window.spent ? _dailyLimit - window.spent : 0;
    }

    function isPaused(address _delegator) external view returns (bool) {
        return pauseStates[_delegator].paused;
    }

    // ─── Internal ────────────────────────────────────────────────

    function _decodeTerms(bytes calldata _terms)
        internal pure returns (
            uint256 dailyLimit,
            uint256 maxPerTx,
            address[] memory allowedContracts,
            bytes4[] memory allowedSelectors
        )
    {
        if (_terms.length < 64) revert InvalidTerms();
        (dailyLimit, maxPerTx, allowedContracts, allowedSelectors) =
            abi.decode(_terms, (uint256, uint256, address[], bytes4[]));
        if (dailyLimit == 0) revert InvalidTerms();
    }

    function _extractExecution(bytes calldata _executionCalldata)
        internal pure returns (address target, uint256 value, bytes4 selector)
    {
        if (_executionCalldata.length < 64) return (address(0), 0, bytes4(0));
        target = address(uint160(uint256(bytes32(_executionCalldata[0:32]))));
        value = uint256(bytes32(_executionCalldata[32:64]));
        if (_executionCalldata.length >= 132) {
            // ABI-encoded bytes: offset 64 = bytes offset, offset 96 = bytes length,
            // offset 128 = start of actual calldata, first 4 bytes = selector
            selector = bytes4(_executionCalldata[128:132]);
        }
    }
}

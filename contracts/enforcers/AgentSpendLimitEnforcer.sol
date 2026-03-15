// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { ICaveatEnforcer, ModeCode } from "./ICaveatEnforcer.sol";

/**
 * @title AgentSpendLimitEnforcer
 * @author clio_ghost (AgentScope)
 * @notice A MetaMask Delegation Framework caveat enforcer that implements
 *         rolling 24-hour spend tracking for AI agent delegations.
 *
 * @dev Unlike the built-in NativeTokenTransferAmountEnforcer which tracks
 *      cumulative spend with no reset, this enforcer implements a rolling
 *      daily window — enabling sustainable, ongoing agent operations with
 *      predictable daily budgets.
 *
 *      Terms encoding: abi.encode(uint256 dailyLimitWei, uint256 maxPerTxWei)
 *
 *      Novel features vs existing MetaMask enforcers:
 *      - Rolling 24h window with automatic reset
 *      - Per-transaction maximum alongside daily aggregate
 *      - Delegation-scoped spend tracking (each delegation hash tracked independently)
 */
contract AgentSpendLimitEnforcer is ICaveatEnforcer {
    /// @notice Spend state per delegation
    struct SpendWindow {
        uint256 windowStart;
        uint256 spent;
    }

    /// @notice Tracks spend per delegation hash
    mapping(bytes32 delegationHash => SpendWindow) public spendWindows;

    /// @notice Emitted when spend is recorded
    event SpendRecorded(
        bytes32 indexed delegationHash,
        address indexed redeemer,
        uint256 amount,
        uint256 dailySpent,
        uint256 dailyLimit
    );

    /// @notice Emitted when daily window resets
    event WindowReset(bytes32 indexed delegationHash, uint256 newWindowStart);

    error DailyLimitExceeded(uint256 attempted, uint256 remaining, uint256 dailyLimit);
    error PerTxLimitExceeded(uint256 amount, uint256 maxPerTx);
    error InvalidTerms();

    /**
     * @notice Enforces spend limits before delegation redemption
     * @dev Decodes the execution calldata to extract the ETH value,
     *      then checks against daily and per-tx limits.
     */
    function beforeHook(
        bytes calldata _terms,
        bytes calldata,
        ModeCode,
        bytes calldata _executionCalldata,
        bytes32 _delegationHash,
        address,
        address _redeemer
    ) external override {
        (uint256 dailyLimit, uint256 maxPerTx) = _decodeTerms(_terms);

        // Decode execution value from calldata
        // ERC-7579 single execution: abi.encode(target, value, calldata)
        uint256 value = _extractValue(_executionCalldata);

        // Check per-tx limit
        if (maxPerTx > 0 && value > maxPerTx) {
            revert PerTxLimitExceeded(value, maxPerTx);
        }

        // Get or reset daily window
        SpendWindow storage window = spendWindows[_delegationHash];
        if (block.timestamp >= window.windowStart + 24 hours) {
            window.windowStart = block.timestamp;
            window.spent = 0;
            emit WindowReset(_delegationHash, block.timestamp);
        }

        // Check daily limit
        uint256 remaining = dailyLimit > window.spent ? dailyLimit - window.spent : 0;
        if (value > remaining) {
            revert DailyLimitExceeded(value, remaining, dailyLimit);
        }

        // Record spend
        window.spent += value;

        emit SpendRecorded(
            _delegationHash,
            _redeemer,
            value,
            window.spent,
            dailyLimit
        );
    }

    /// @notice No-op hooks (only beforeHook is needed)
    function beforeAllHook(bytes calldata, bytes calldata, ModeCode, bytes calldata, bytes32, address, address) external override {}
    function afterHook(bytes calldata, bytes calldata, ModeCode, bytes calldata, bytes32, address, address) external override {}
    function afterAllHook(bytes calldata, bytes calldata, ModeCode, bytes calldata, bytes32, address, address) external override {}

    // ─── View Functions ──────────────────────────────────────────

    /// @notice Get remaining daily budget for a delegation
    function getRemainingBudget(bytes32 _delegationHash, uint256 _dailyLimit)
        external view returns (uint256)
    {
        SpendWindow storage window = spendWindows[_delegationHash];
        if (block.timestamp >= window.windowStart + 24 hours) {
            return _dailyLimit; // Window expired, full budget available
        }
        return _dailyLimit > window.spent ? _dailyLimit - window.spent : 0;
    }

    /// @notice Get current window info for a delegation
    function getWindowInfo(bytes32 _delegationHash)
        external view returns (uint256 windowStart, uint256 spent, uint256 windowEnd)
    {
        SpendWindow storage window = spendWindows[_delegationHash];
        return (window.windowStart, window.spent, window.windowStart + 24 hours);
    }

    // ─── Internal ────────────────────────────────────────────────

    function _decodeTerms(bytes calldata _terms) internal pure returns (uint256 dailyLimit, uint256 maxPerTx) {
        if (_terms.length < 64) revert InvalidTerms();
        (dailyLimit, maxPerTx) = abi.decode(_terms, (uint256, uint256));
        if (dailyLimit == 0) revert InvalidTerms();
    }

    /// @notice Extract ETH value from ERC-7579 execution calldata
    /// @dev Single execution encoding: abi.encode(address target, uint256 value, bytes calldata)
    function _extractValue(bytes calldata _executionCalldata) internal pure returns (uint256) {
        if (_executionCalldata.length < 64) return 0;
        // Skip first 32 bytes (target address), next 32 bytes is value
        return uint256(bytes32(_executionCalldata[32:64]));
    }
}

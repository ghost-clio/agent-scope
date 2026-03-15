// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ICaveatEnforcer
 * @notice Interface from MetaMask Delegation Framework
 * @dev See: https://github.com/MetaMask/delegation-framework
 */

/// @dev Execution mode encoding per ERC-7579
type ModeCode is bytes32;

interface ICaveatEnforcer {
    function beforeAllHook(
        bytes calldata _terms,
        bytes calldata _args,
        ModeCode _mode,
        bytes calldata _executionCalldata,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) external;

    function beforeHook(
        bytes calldata _terms,
        bytes calldata _args,
        ModeCode _mode,
        bytes calldata _executionCalldata,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) external;

    function afterHook(
        bytes calldata _terms,
        bytes calldata _args,
        ModeCode _mode,
        bytes calldata _executionCalldata,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) external;

    function afterAllHook(
        bytes calldata _terms,
        bytes calldata _args,
        ModeCode _mode,
        bytes calldata _executionCalldata,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IExecutor - Minimal interface for Safe-compatible execution
/// @dev AgentScopeModule calls this to execute transactions through a Safe
interface IExecutor {
    enum Operation { Call, DelegateCall }
    
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        Operation operation
    ) external returns (bool success);
}

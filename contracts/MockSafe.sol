// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IExecutor.sol";

/// @title MockSafe — Minimal Safe mock for testing AgentScopeModule
/// @dev Simulates Safe's module execution and acts as msg.sender for onlySafe checks
contract MockSafe is IExecutor {
    receive() external payable {}

    /// @notice Simulate calling a module function AS the Safe
    /// @dev This lets tests call setAgentPolicy, revokeAgent, etc. with msg.sender = this
    function callModule(address module, bytes memory data) external {
        (bool success, bytes memory returnData) = module.call(data);
        if (!success) {
            // Bubble up the revert
            assembly {
                revert(add(returnData, 32), mload(returnData))
            }
        }
    }

    /// @notice Simulate Safe's execTransactionFromModule
    /// @dev Just forwards the call with the Safe's ETH
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        Operation /*operation*/
    ) external override returns (bool success) {
        (success, ) = to.call{value: value}(data);
    }
}

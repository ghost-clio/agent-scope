// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal mock ENS registry for testing ERC8004ENSBridge
contract MockENS {
    mapping(bytes32 => address) private _owners;

    function setOwner(bytes32 node, address ownerAddr) external {
        _owners[node] = ownerAddr;
    }

    function owner(bytes32 node) external view returns (address) {
        return _owners[node];
    }
}

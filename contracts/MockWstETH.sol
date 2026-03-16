// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockWstETH
 * @notice Mock wstETH for testing with configurable exchange rate.
 */
contract MockWstETH is ERC20 {
    uint256 private _stEthPerToken;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _stEthPerToken = 1e18; // 1:1 initially
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function stEthPerToken() external view returns (uint256) {
        return _stEthPerToken;
    }

    /// @notice Test helper: set the exchange rate
    function setStEthPerToken(uint256 rate) external {
        _stEthPerToken = rate;
    }
}

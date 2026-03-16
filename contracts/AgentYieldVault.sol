// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentYieldVault
 * @notice Yield-only spending for AI agents. Principal stays locked.
 * @dev Integrates with wstETH (or any yield-bearing ERC20). The owner deposits
 *      tokens as principal. As the token's value accrues (wstETH appreciation),
 *      the agent can only spend the yield — never the principal.
 *
 *      Built for the Lido "stETH Agent Treasury" bounty at The Synthesis.
 *
 * @author clio_ghost
 */

interface IWstETH {
    function stEthPerToken() external view returns (uint256);
    function wrap(uint256 stETHAmount) external returns (uint256);
    function unwrap(uint256 wstETHAmount) external returns (uint256);
}

contract AgentYieldVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════
    //  State
    // ═══════════════════════════════════════════════════════

    address public immutable owner;
    IERC20 public immutable yieldToken;      // wstETH
    address public agent;
    bool public paused;

    // Principal tracking
    uint256 public principalShares;           // wstETH shares deposited as principal
    uint256 public principalStETHValue;       // principal value in stETH terms at deposit time
    uint256 public totalWithdrawnYield;        // cumulative yield withdrawn by agent

    // Agent spending limits
    uint256 public maxPerTxWei;               // max yield per transaction (in underlying value)
    uint256 public dailyYieldCap;             // max yield spendable per day
    uint256 public dailySpent;                // yield spent in current window
    uint256 public lastResetTimestamp;         // start of current 24h window

    // Whitelist
    bool public whitelistEnabled;
    address[] public allowedRecipients;
    mapping(address => bool) public isAllowedRecipient;

    // ═══════════════════════════════════════════════════════
    //  Events
    // ═══════════════════════════════════════════════════════

    event PrincipalDeposited(address indexed depositor, uint256 amount, uint256 shares);
    event YieldWithdrawn(address indexed agent, address indexed recipient, uint256 amount);
    event PrincipalWithdrawn(address indexed owner, uint256 shares, uint256 amount);
    event AgentSet(address indexed agent);
    event AgentRevoked(address indexed agent);
    event Paused(bool paused);
    event SpendingLimitsUpdated(uint256 maxPerTx, uint256 dailyCap);
    event RecipientAdded(address indexed recipient);
    event RecipientRemoved(address indexed recipient);

    // ═══════════════════════════════════════════════════════
    //  Errors
    // ═══════════════════════════════════════════════════════

    error OnlyOwner();
    error OnlyAgent();
    error VaultPaused();
    error NoYieldAvailable();
    error ExceedsAvailableYield(uint256 requested, uint256 available);
    error ExceedsPerTxLimit(uint256 requested, uint256 limit);
    error ExceedsDailyCap(uint256 requested, uint256 remaining);
    error RecipientNotWhitelisted(address recipient);
    error ZeroAddress();
    error ZeroAmount();

    // ═══════════════════════════════════════════════════════
    //  Modifiers
    // ═══════════════════════════════════════════════════════

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert OnlyAgent();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert VaultPaused();
        _;
    }

    // ═══════════════════════════════════════════════════════
    //  Constructor
    // ═══════════════════════════════════════════════════════

    constructor(address _yieldToken) {
        if (_yieldToken == address(0)) revert ZeroAddress();
        owner = msg.sender;
        yieldToken = IERC20(_yieldToken);
        lastResetTimestamp = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════
    //  Owner: Deposit principal
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Deposit wstETH as locked principal. Only yield is spendable.
     * @param amount Amount of wstETH to deposit
     */
    function depositPrincipal(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();

        yieldToken.safeTransferFrom(msg.sender, address(this), amount);
        principalShares += amount;

        // Track principal value in stETH terms for accurate yield calculation
        // wstETH is non-rebasing; yield accrues via exchange rate appreciation
        uint256 snapshotRate = IWstETH(address(yieldToken)).stEthPerToken();
        principalStETHValue += amount * snapshotRate / 1e18;

        emit PrincipalDeposited(msg.sender, amount, principalShares);
    }

    /**
     * @notice Withdraw principal. Only owner. Agent cannot touch this.
     * @param shares Amount of wstETH shares to withdraw
     */
    function withdrawPrincipal(uint256 shares) external onlyOwner nonReentrant {
        require(shares <= principalShares, "Exceeds principal");
        // Proportionally reduce the stETH value tracking
        if (principalShares > 0) {
            principalStETHValue -= (principalStETHValue * shares) / principalShares;
        }
        principalShares -= shares;
        yieldToken.safeTransfer(owner, shares);

        emit PrincipalWithdrawn(owner, shares, shares);
    }

    // ═══════════════════════════════════════════════════════
    //  Owner: Agent management
    // ═══════════════════════════════════════════════════════

    function setAgent(address _agent) external onlyOwner {
        if (_agent == address(0)) revert ZeroAddress();
        agent = _agent;
        emit AgentSet(_agent);
    }

    function revokeAgent() external onlyOwner {
        address old = agent;
        agent = address(0);
        emit AgentRevoked(old);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function setSpendingLimits(uint256 _maxPerTx, uint256 _dailyCap) external onlyOwner {
        maxPerTxWei = _maxPerTx;
        dailyYieldCap = _dailyCap;
        emit SpendingLimitsUpdated(_maxPerTx, _dailyCap);
    }

    function addRecipient(address recipient) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        if (!isAllowedRecipient[recipient]) {
            isAllowedRecipient[recipient] = true;
            allowedRecipients.push(recipient);
            whitelistEnabled = true;
            emit RecipientAdded(recipient);
        }
    }

    function removeRecipient(address recipient) external onlyOwner {
        if (isAllowedRecipient[recipient]) {
            isAllowedRecipient[recipient] = false;
            // Don't bother removing from array — check mapping
            emit RecipientRemoved(recipient);
        }
    }

    /// @notice Disable recipient whitelist entirely, allowing any recipient
    function disableWhitelist() external onlyOwner {
        whitelistEnabled = false;
    }

    // ═══════════════════════════════════════════════════════
    //  Agent: Spend yield ONLY
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Agent withdraws yield to a whitelisted recipient.
     *         Cannot touch principal — only accrued yield.
     * @param recipient Must be whitelisted (or no whitelist if empty)
     * @param amount Amount of wstETH to send from yield
     */
    function spendYield(
        address recipient,
        uint256 amount
    ) external onlyAgent whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();

        // Check whitelist (disabled = allow all)
        if (whitelistEnabled && !isAllowedRecipient[recipient]) {
            revert RecipientNotWhitelisted(recipient);
        }

        // Check per-tx limit
        if (maxPerTxWei > 0 && amount > maxPerTxWei) {
            revert ExceedsPerTxLimit(amount, maxPerTxWei);
        }

        // Reset daily window if needed
        if (block.timestamp >= lastResetTimestamp + 24 hours) {
            dailySpent = 0;
            lastResetTimestamp = block.timestamp;
        }

        // Check daily cap
        if (dailyYieldCap > 0 && dailySpent + amount > dailyYieldCap) {
            revert ExceedsDailyCap(amount, dailyYieldCap - dailySpent);
        }

        // Check available yield
        uint256 available = availableYield();
        if (amount > available) {
            revert ExceedsAvailableYield(amount, available);
        }

        // Update state
        totalWithdrawnYield += amount;
        dailySpent += amount;

        // Transfer
        yieldToken.safeTransfer(recipient, amount);

        emit YieldWithdrawn(agent, recipient, amount);
    }

    // ═══════════════════════════════════════════════════════
    //  View functions
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Total wstETH balance in vault
     */
    function totalBalance() public view returns (uint256) {
        return yieldToken.balanceOf(address(this));
    }

    /**
     * @notice Yield available for agent to spend
     * @dev For non-rebasing tokens like wstETH, yield = appreciation in exchange rate.
     *      We track the stETH value of principal at deposit time. Current stETH value
     *      minus original stETH value = yield in stETH terms, converted back to wstETH.
     */
    function availableYield() public view returns (uint256) {
        uint256 balance = totalBalance();
        if (balance == 0 || principalShares == 0) return 0;

        // Current stETH value of entire balance
        uint256 currentRate = IWstETH(address(yieldToken)).stEthPerToken();
        uint256 currentStETHValue = balance * currentRate / 1e18;

        // Yield = current stETH value - principal stETH value, converted back to wstETH
        if (currentStETHValue <= principalStETHValue) return 0;
        uint256 yieldInStETH = currentStETHValue - principalStETHValue;

        // Convert stETH yield back to wstETH: wstETH = stETH * 1e18 / rate
        uint256 yieldInWstETH = yieldInStETH * 1e18 / currentRate;

        // Cannot exceed balance minus principal shares (safety bound)
        uint256 maxYield = balance > principalShares ? balance - principalShares : 0;
        return yieldInWstETH > maxYield ? maxYield : yieldInWstETH;
    }

    /**
     * @notice Daily yield remaining for agent
     */
    function dailyYieldRemaining() public view returns (uint256) {
        if (dailyYieldCap == 0) return availableYield();

        // Check if window has reset
        if (block.timestamp >= lastResetTimestamp + 24 hours) {
            return dailyYieldCap > availableYield() ? availableYield() : dailyYieldCap;
        }

        uint256 remaining = dailyYieldCap > dailySpent ? dailyYieldCap - dailySpent : 0;
        return remaining > availableYield() ? availableYield() : remaining;
    }

    /**
     * @notice Full vault status for agent reasoning
     */
    function getVaultStatus() external view returns (
        uint256 _principalShares,
        uint256 _totalBalance,
        uint256 _availableYield,
        uint256 _dailyRemaining,
        uint256 _totalWithdrawn,
        bool _paused,
        address _agent
    ) {
        return (
            principalShares,
            totalBalance(),
            availableYield(),
            dailyYieldRemaining(),
            totalWithdrawnYield,
            paused,
            agent
        );
    }

    /**
     * @notice Number of whitelisted recipients
     */
    function recipientCount() external view returns (uint256) {
        return allowedRecipients.length;
    }
}

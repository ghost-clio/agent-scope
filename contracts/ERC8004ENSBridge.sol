// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC8004ENSBridge
 * @notice Bridges ENS identity (L1) with ERC-8004 agent identity (L2/Base).
 *
 * Problem: ERC-8004 gives agents verifiable on-chain identity, but identities
 * are just hex participant IDs — not human-readable, not discoverable.
 * ENS gives human-readable names but has no concept of "agent identity."
 *
 * Solution: This contract extends ENS with ERC-8004-aware resolution.
 * An agent registers their ERC-8004 identity against their ENS name,
 * creating a two-way bridge:
 *   ENS name → ERC-8004 identity (discovery)
 *   ERC-8004 participantId → ENS name (reverse lookup)
 *
 * Architecture:
 *   ┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
 *   │  ENS (L1)   │────▶│ ERC8004ENSBridge │◀────│ ERC-8004 (L2)│
 *   │ ghost.eth   │     │   Links names    │     │ participantId│
 *   │ human name  │     │   to identities  │     │ agent scope  │
 *   └─────────────┘     └──────────────────┘     └──────────────┘
 *
 * Trust model:
 *   - Only the ENS name owner can register their ERC-8004 identity
 *   - Registration includes the L2 chain ID + registration tx hash
 *   - Verifiers can independently check the L2 tx to confirm
 *   - The bridge contract itself doesn't verify cross-chain (no oracle needed)
 *     — it stores attestations that anyone can verify off-chain
 *
 * This is a proposed standard. No existing bridge between ENS and ERC-8004.
 * Ghost Protocol is the first implementation.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice ENS registry interface (minimal)
interface IENS {
    function owner(bytes32 node) external view returns (address);
}

/// @notice ENS public resolver interface (for text records)
interface IENSResolver {
    function text(bytes32 node, string calldata key) external view returns (string memory);
}

contract ERC8004ENSBridge is Ownable {
    // ─── Structs ───────────────────────────────────────────

    /// @notice An agent's cross-chain identity linking ENS to ERC-8004
    struct AgentIdentity {
        bytes32 ensNode;            // ENS namehash of the agent's .eth name
        string ensName;             // Human-readable ENS name (for reverse lookup)
        bytes16 participantId;      // ERC-8004 participant ID
        uint256 l2ChainId;          // Chain where ERC-8004 identity lives (e.g., 8453 for Base)
        bytes32 registrationTxHash; // L2 tx hash of ERC-8004 registration
        string manifestUri;         // URL to agent.json manifest
        address registrant;         // Who registered this link
        uint256 registeredAt;       // Timestamp of registration
        bool active;                // Can be deactivated by owner
    }

    /// @notice Capability declaration (from agent.json, stored on-chain for discoverability)
    struct AgentCapability {
        string name;          // e.g., "treasury-management"
        string version;       // e.g., "1.0.0"
        string description;   // Human-readable description
    }

    // ─── State ─────────────────────────────────────────────

    IENS public immutable ens;

    /// @notice ENS node → agent identity
    mapping(bytes32 => AgentIdentity) public identities;

    /// @notice ERC-8004 participantId → ENS node (reverse lookup)
    mapping(bytes16 => bytes32) public reverseMap;

    /// @notice ENS node → capabilities array
    mapping(bytes32 => AgentCapability[]) private _capabilities;

    /// @notice All registered ENS nodes (for enumeration)
    bytes32[] public registeredNodes;
    mapping(bytes32 => uint256) private _nodeIndex;

    /// @notice Registration fee (optional, can be 0)
    uint256 public registrationFee;

    // ─── Events ────────────────────────────────────────────

    event IdentityLinked(
        bytes32 indexed ensNode,
        bytes16 indexed participantId,
        string ensName,
        uint256 l2ChainId,
        address registrant
    );

    event IdentityUpdated(
        bytes32 indexed ensNode,
        string manifestUri
    );

    event IdentityDeactivated(bytes32 indexed ensNode);
    event IdentityReactivated(bytes32 indexed ensNode);

    event CapabilityAdded(
        bytes32 indexed ensNode,
        string name,
        string version
    );

    event CapabilitiesCleared(bytes32 indexed ensNode);

    // ─── Errors ────────────────────────────────────────────

    error NotENSOwner(bytes32 node, address caller);
    error AlreadyRegistered(bytes32 node);
    error NotRegistered(bytes32 node);
    error ParticipantIdTaken(bytes16 participantId);
    error InsufficientFee(uint256 sent, uint256 required);
    error InvalidParticipantId();
    error NotRegistrant(bytes32 node, address caller);

    // ─── Constructor ───────────────────────────────────────

    /// @param _ens Address of the ENS registry (0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e on mainnet)
    constructor(address _ens) Ownable(msg.sender) {
        require(_ens != address(0), "zero address");
        ens = IENS(_ens);
    }

    // ─── Registration ──────────────────────────────────────

    /**
     * @notice Link your ENS name to your ERC-8004 agent identity.
     * @dev Caller must be the ENS name owner. Each name and participantId can only be registered once.
     *
     * @param ensNode       The namehash of your ENS name
     * @param ensName       Human-readable name (e.g., "ghost-protocol.eth")
     * @param participantId Your ERC-8004 participant ID (16 bytes)
     * @param l2ChainId     Chain ID where your ERC-8004 identity lives (8453 for Base)
     * @param regTxHash     Transaction hash of your ERC-8004 registration on L2
     * @param manifestUri   URL to your agent.json manifest
     */
    function registerIdentity(
        bytes32 ensNode,
        string calldata ensName,
        bytes16 participantId,
        uint256 l2ChainId,
        bytes32 regTxHash,
        string calldata manifestUri
    ) external payable {
        // Verify caller owns the ENS name
        if (ens.owner(ensNode) != msg.sender) {
            revert NotENSOwner(ensNode, msg.sender);
        }

        // Check not already registered
        if (identities[ensNode].active) {
            revert AlreadyRegistered(ensNode);
        }

        // Check participantId not taken
        if (participantId == bytes16(0)) {
            revert InvalidParticipantId();
        }
        if (reverseMap[participantId] != bytes32(0)) {
            revert ParticipantIdTaken(participantId);
        }

        // Check fee
        if (msg.value < registrationFee) {
            revert InsufficientFee(msg.value, registrationFee);
        }

        // Store identity
        identities[ensNode] = AgentIdentity({
            ensNode: ensNode,
            ensName: ensName,
            participantId: participantId,
            l2ChainId: l2ChainId,
            registrationTxHash: regTxHash,
            manifestUri: manifestUri,
            registrant: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });

        // Store reverse mapping
        reverseMap[participantId] = ensNode;

        // Track for enumeration
        _nodeIndex[ensNode] = registeredNodes.length;
        registeredNodes.push(ensNode);

        emit IdentityLinked(ensNode, participantId, ensName, l2ChainId, msg.sender);
    }

    /**
     * @notice Update your agent's manifest URI.
     * @dev Only the original registrant can update.
     */
    function updateManifest(bytes32 ensNode, string calldata manifestUri) external {
        AgentIdentity storage id = identities[ensNode];
        if (!id.active) revert NotRegistered(ensNode);
        if (id.registrant != msg.sender) revert NotRegistrant(ensNode, msg.sender);

        id.manifestUri = manifestUri;
        emit IdentityUpdated(ensNode, manifestUri);
    }

    /**
     * @notice Deactivate your identity link (reversible).
     */
    function deactivate(bytes32 ensNode) external {
        AgentIdentity storage id = identities[ensNode];
        if (!id.active) revert NotRegistered(ensNode);
        if (id.registrant != msg.sender && msg.sender != owner()) {
            revert NotRegistrant(ensNode, msg.sender);
        }

        id.active = false;
        emit IdentityDeactivated(ensNode);
    }

    /**
     * @notice Reactivate a deactivated identity link.
     */
    function reactivate(bytes32 ensNode) external {
        AgentIdentity storage id = identities[ensNode];
        if (id.registrant == address(0)) revert NotRegistered(ensNode);
        if (id.registrant != msg.sender) revert NotRegistrant(ensNode, msg.sender);

        id.active = true;
        emit IdentityReactivated(ensNode);
    }

    // ─── Capabilities ──────────────────────────────────────

    /**
     * @notice Declare a capability for your agent (stored on-chain for discoverability).
     */
    function addCapability(
        bytes32 ensNode,
        string calldata name,
        string calldata version,
        string calldata description
    ) external {
        AgentIdentity storage id = identities[ensNode];
        if (!id.active) revert NotRegistered(ensNode);
        if (id.registrant != msg.sender) revert NotRegistrant(ensNode, msg.sender);

        _capabilities[ensNode].push(AgentCapability({
            name: name,
            version: version,
            description: description
        }));

        emit CapabilityAdded(ensNode, name, version);
    }

    /**
     * @notice Clear all capabilities (to re-declare after update).
     */
    function clearCapabilities(bytes32 ensNode) external {
        AgentIdentity storage id = identities[ensNode];
        if (!id.active) revert NotRegistered(ensNode);
        if (id.registrant != msg.sender) revert NotRegistrant(ensNode, msg.sender);

        delete _capabilities[ensNode];
        emit CapabilitiesCleared(ensNode);
    }

    // ─── Views ─────────────────────────────────────────────

    /**
     * @notice Resolve an ENS name to its ERC-8004 agent identity.
     * @dev This is the primary discovery function. Given a name you trust (ENS),
     *      get the agent's verifiable identity (ERC-8004).
     */
    function resolveAgent(bytes32 ensNode) external view returns (
        bool active,
        bytes16 participantId,
        uint256 l2ChainId,
        bytes32 registrationTxHash,
        string memory manifestUri,
        string memory ensName
    ) {
        AgentIdentity storage id = identities[ensNode];
        return (
            id.active,
            id.participantId,
            id.l2ChainId,
            id.registrationTxHash,
            id.manifestUri,
            id.ensName
        );
    }

    /**
     * @notice Reverse lookup: ERC-8004 participantId → ENS name.
     * @dev Given a participantId you found on-chain, discover who this agent is.
     */
    function lookupByParticipantId(bytes16 participantId) external view returns (
        bool found,
        string memory ensName,
        uint256 l2ChainId,
        string memory manifestUri
    ) {
        bytes32 node = reverseMap[participantId];
        if (node == bytes32(0)) return (false, "", 0, "");

        AgentIdentity storage id = identities[node];
        return (id.active, id.ensName, id.l2ChainId, id.manifestUri);
    }

    /**
     * @notice Get capabilities for an agent.
     */
    function getCapabilities(bytes32 ensNode) external view returns (AgentCapability[] memory) {
        return _capabilities[ensNode];
    }

    /**
     * @notice Total number of registered agents.
     */
    function totalRegistered() external view returns (uint256) {
        return registeredNodes.length;
    }

    // ─── Admin ─────────────────────────────────────────────

    function setRegistrationFee(uint256 fee) external onlyOwner {
        registrationFee = fee;
    }

    function withdraw() external onlyOwner {
        (bool ok,) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }
}

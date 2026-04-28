// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {externalEuint256, euint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/// @title IPropertyToken
/// @author ChainEstate Team
/// @notice Interface for ERC-7984 confidential property token
interface IPropertyToken {
    /// @notice Emitted when tokens are purchased (amount kept private)
    event TokensPurchased(address indexed buyer, uint256 indexed propertyId, uint256 timestamp);

    /// @notice Emitted when tokens are transferred (amount kept private)
    event TokensTransferred(address indexed from, address indexed to, uint256 timestamp);

    /// @notice Emitted when operator is granted
    event OperatorGranted(address indexed holder, address indexed operator, uint256 expiry);

    /// @notice Emitted when operator is revoked
    event OperatorRevoked(address indexed holder, address indexed operator);

    /// @notice Initialize the token contract (called once by registry)
    function initialize(
        uint256 _propertyId,
        address _registry,
        address _rentDistributor,
        uint256 _totalSupply,
        uint256 _pricePerToken
    ) external;

    /// @notice Purchase tokens with USDT using encrypted amount handle
    /// @param handle Encrypted token amount from JS SDK
    /// @param handleProof Proof from Handle Gateway
    function purchaseTokens(
        externalEuint256 handle,
        bytes calldata handleProof
    ) external;

    /// @notice Grant operator rights
    /// @param operator Address to grant operator rights to
    /// @param expiry Unix timestamp when operator rights expire
    function grantOperator(address operator, uint256 expiry) external;

    /// @notice Revoke operator rights
    /// @param operator Address to revoke
    function revokeOperator(address operator) external;

    /// @notice Transfer tokens to another address (ERC-7984 pattern)
    function transfer(
        address to,
        externalEuint256 handle,
        bytes calldata handleProof
    ) external;

    /// @notice Operator transfer on behalf of holder
    function operatorTransfer(
        address from,
        address to,
        externalEuint256 handle,
        bytes calldata handleProof
    ) external;

    /// @notice Check if operator is active for a holder
    function isOperatorActive(address holder, address operator) external view returns (bool);

    /// @notice Get property ID associated with this token
    function getPropertyId() external view returns (uint256);
}

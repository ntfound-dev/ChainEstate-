// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";
import {
    Nox,
    euint256,
    ebool,
    externalEuint256
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPropertyRegistry} from "../interfaces/IPropertyRegistry.sol";
import {AlreadyInitialized, ZeroAddress, TransferFailed, OperatorExpired, Unauthorized, InvalidAmount} from "../libraries/ChainEstateLib.sol";

/// @title PropertyToken
/// @author ChainEstate Team
/// @notice ERC-7984 Confidential Token representing fractional ownership of a real estate property.
///         Ownership balances and transfer amounts are encrypted via iExec Nox Protocol.
/// @dev One instance deployed per property via CREATE2 from PropertyRegistry.
///      Operations are asynchronous — TEE (Intel TDX) processes encrypted computations off-chain.
/// @custom:security-contact security@chainestate.io
contract PropertyToken is ERC7984, ReentrancyGuard, Pausable, Ownable {
    // ============ Storage ============

    uint256 public propertyId;
    address public registry;
    address public rentDistributor;
    address public usdtToken;
    uint256 public pricePerToken;
    uint256 public maxSupply;
    uint256 public totalMinted;
    bool private initialized;

    // ============ Events ============

    /// @notice Emitted when tokens are purchased — amount intentionally omitted for privacy
    event TokensPurchased(address indexed buyer, uint256 indexed propertyId, uint256 timestamp);

    /// @notice Emitted when tokens are transferred — amount intentionally omitted for privacy
    event TokensTransferred(address indexed from, address indexed to, uint256 timestamp);

    /// @notice Emitted when operator is granted to an address
    event OperatorGranted(address indexed holder, address indexed operator, uint256 expiry);

    /// @notice Emitted when operator is revoked
    event OperatorRevoked(address indexed holder, address indexed operator);

    // ============ Constructor ============

    constructor() ERC7984("ChainEstate Property Token", "CPROP", "") Ownable(msg.sender) {}

    // ============ Initializer ============

    /// @notice Initialize the token contract — called once by PropertyRegistry after CREATE2 deployment
    /// @param _propertyId ID of the property in the registry
    /// @param _registry Address of PropertyRegistry
    /// @param _rentDistributor Address of RentDistributor
    /// @param _totalSupply Total token supply for this property
    /// @param _pricePerToken Price per token in USDT (6 decimals)
    /// @param _usdtToken Address of USDT token contract
    function initialize(
        uint256 _propertyId,
        address _registry,
        address _rentDistributor,
        uint256 _totalSupply,
        uint256 _pricePerToken,
        address _usdtToken
    ) external onlyOwner {
        if (initialized) revert AlreadyInitialized();
        if (_registry == address(0)) revert ZeroAddress();
        if (_usdtToken == address(0)) revert ZeroAddress();
        if (_totalSupply == 0) revert InvalidAmount();

        initialized = true;
        propertyId = _propertyId;
        registry = _registry;
        rentDistributor = _rentDistributor;
        pricePerToken = _pricePerToken;
        maxSupply = _totalSupply;
        usdtToken = _usdtToken;

        // Grant operator rights to RentDistributor for 1 year
        if (_rentDistributor != address(0)) {
            uint48 expiry = uint48(block.timestamp + 365 days);
            _setOperator(_rentDistributor, address(0), expiry);
        }
    }

    // ============ Purchase ============

    /// @notice Investor purchases tokens by providing USDT and an encrypted amount handle
    /// @param handle Encrypted token quantity produced by the iExec Nox JS SDK
    /// @param handleProof Input proof from Handle Gateway validating the encrypted amount
    /// @dev USDT payment is cleartext for accounting; the resulting balance is encrypted.
    ///      After purchase, registers holder in registry for rent distribution eligibility.
    function purchaseTokens(
        externalEuint256 handle,
        bytes calldata handleProof,
        uint256 clearAmount
    ) external nonReentrant whenNotPaused {
        if (clearAmount == 0) revert InvalidAmount();
        if (totalMinted + clearAmount > maxSupply) revert InvalidAmount();

        uint256 totalCost = clearAmount * pricePerToken;

        bool ok = IERC20(usdtToken).transferFrom(msg.sender, owner(), totalCost);
        if (!ok) revert TransferFailed();

        totalMinted += clearAmount;

        euint256 encryptedAmount = Nox.fromExternal(handle, handleProof);
        Nox.allowThis(encryptedAmount);
        Nox.allow(encryptedAmount, msg.sender);

        _mint(msg.sender, encryptedAmount);

        IPropertyRegistry(registry).registerHolder(propertyId, msg.sender);

        emit TokensPurchased(msg.sender, propertyId, block.timestamp);
    }

    // ============ Operator Management ============

    /// @notice Grant operator rights to an address (e.g., RentDistributor or SecondaryMarket)
    /// @param operator Address receiving operator rights
    /// @param expiry Unix timestamp when rights expire
    function grantOperator(address operator, uint256 expiry) external whenNotPaused {
        if (operator == address(0)) revert ZeroAddress();
        if (expiry <= block.timestamp) revert OperatorExpired(operator);
        _setOperator(msg.sender, operator, uint48(expiry));
        emit OperatorGranted(msg.sender, operator, expiry);
    }

    /// @notice Revoke operator rights
    /// @param operator Address to revoke
    function revokeOperator(address operator) external {
        _setOperator(msg.sender, operator, 0);
        emit OperatorRevoked(msg.sender, operator);
    }

    // ============ Transfers ============

    /// @notice Transfer tokens using an encrypted amount handle
    /// @dev Per ERC-7984 spec: if balance is insufficient, the transfer silently succeeds
    ///      with 0 tokens transferred — this prevents balance inference via revert analysis.
    function transfer(
        address to,
        externalEuint256 handle,
        bytes calldata handleProof
    ) external nonReentrant whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        euint256 amount = Nox.fromExternal(handle, handleProof);
        Nox.allowThis(amount);
        Nox.allow(amount, msg.sender);
        confidentialTransfer(to, amount);
        emit TokensTransferred(msg.sender, to, block.timestamp);
    }

    /// @notice Operator transfers tokens on behalf of a holder
    /// @dev Used by RentDistributor and SecondaryMarket
    function operatorTransfer(
        address from,
        address to,
        externalEuint256 handle,
        bytes calldata handleProof
    ) external nonReentrant whenNotPaused {
        if (!isOperator(from, msg.sender)) revert OperatorExpired(msg.sender);
        if (to == address(0)) revert ZeroAddress();
        euint256 amount = Nox.fromExternal(handle, handleProof);
        Nox.allowThis(amount);
        Nox.allow(amount, msg.sender);
        confidentialTransferFrom(from, to, amount);
        emit TokensTransferred(from, to, block.timestamp);
    }

    // ============ Admin ============

    /// @notice Pause all token operations (emergency brake)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause operations
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View ============

    /// @notice Check whether operator rights are currently active for a holder
    function isOperatorActive(address holder, address operator) external view returns (bool) {
        return isOperator(holder, operator);
    }

    /// @notice Returns the property ID this token represents
    function getPropertyId() external view returns (uint256) {
        return propertyId;
    }

    // ============ Internal helpers ============

    /// @dev Wraps ERC7984Base._setOperator with the (holder, operator, until) signature
    function _setOperator(address holder, address operator, uint48 until) internal override {
        super._setOperator(holder, operator, until);
    }
}

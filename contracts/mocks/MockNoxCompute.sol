// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {INoxCompute} from "@iexec-nox/nox-protocol-contracts/contracts/interfaces/INoxCompute.sol";
import {TEEType} from "@iexec-nox/nox-protocol-contracts/contracts/shared/TypeUtils.sol";

/// @dev Mock NoxCompute for local Hardhat testing.
///      Skips all TEE-based proof validation and returns passthrough handles.
///      Deploy at address 0x44C00793aD4975617b3B5Fc27D4FB78E772c8236 in test setup.
contract MockNoxCompute is INoxCompute {
    // Persistent ACL: handle => account => allowed
    mapping(bytes32 => mapping(address => bool)) private _acl;

    // Transient-equivalent ACL (stored persistently for simplicity in tests)
    mapping(bytes32 => mapping(address => bool)) private _transientAcl;

    // ── ACL ──────────────────────────────────────────────────────────────

    function allow(bytes32 handle, address account) external override {
        _acl[handle][account] = true;
        emit Allowed(msg.sender, account, handle);
    }

    function allowTransient(bytes32 handle, address account) external override {
        _transientAcl[handle][account] = true;
    }

    function disallowTransient(bytes32 handle, address account) external override {
        _transientAcl[handle][account] = false;
    }

    function isAllowed(bytes32 /* handle */, address /* account */) external pure override returns (bool) {
        // In local tests, always return true so encrypted ops don't block
        return true;
    }

    function validateAllowedForAll(address account, bytes32[] calldata handles) external view override {
        // Always passes in tests
    }

    function addViewer(bytes32 handle, address viewer) external override {}

    function isViewer(bytes32 /* handle */, address /* viewer */) external pure override returns (bool) {
        return true;
    }

    function allowPublicDecryption(bytes32 handle) external override {}

    function isPubliclyDecryptable(bytes32 /* handle */) external pure override returns (bool) {
        return true;
    }

    // ── Input validation (skipped in tests) ──────────────────────────────

    function validateInputProof(
        bytes32 handle,
        address owner,
        bytes calldata proof,
        TEEType teeType
    ) external override {
        // Always passes in tests — no real TEE validation
    }

    function validateDecryptionProof(
        bytes32 /* handle */,
        bytes calldata /* decryptionProof */
    ) external pure override returns (bytes memory) {
        return abi.encode(uint256(0));
    }

    // ── wrapAsPublicHandle ────────────────────────────────────────────────

    function wrapAsPublicHandle(bytes32 value, TEEType teeType) external override returns (bytes32) {
        // Return a deterministic public handle (just use value as the handle)
        bytes32 result = keccak256(abi.encode(value, teeType, "public"));
        emit WrapAsPublicHandle(msg.sender, value, teeType, result);
        return result;
    }

    // ── Arithmetic ops (identity transforms in tests) ─────────────────────

    function add(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(left) + uint256(right));
        emit Add(msg.sender, left, right, result);
    }

    function sub(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(left) - uint256(right));
        emit Sub(msg.sender, left, right, result);
    }

    function mul(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(left) * uint256(right));
        emit Mul(msg.sender, left, right, result);
    }

    function div(bytes32 numerator, bytes32 denominator) external override returns (bytes32 result) {
        result = uint256(denominator) == 0 ? bytes32(type(uint256).max) : bytes32(uint256(numerator) / uint256(denominator));
        emit Div(msg.sender, numerator, denominator, result);
    }

    function safeAdd(bytes32 left, bytes32 right) external override returns (bytes32 success, bytes32 result) {
        unchecked {
            result = bytes32(uint256(left) + uint256(right));
        }
        success = bytes32(uint256(1)); // encrypted true
        emit SafeAdd(msg.sender, left, right, success, result);
    }

    function safeSub(bytes32 left, bytes32 right) external override returns (bytes32 success, bytes32 result) {
        if (uint256(left) >= uint256(right)) {
            result = bytes32(uint256(left) - uint256(right));
            success = bytes32(uint256(1));
        } else {
            result = bytes32(uint256(0));
            success = bytes32(uint256(0));
        }
        emit SafeSub(msg.sender, left, right, success, result);
    }

    function safeMul(bytes32 left, bytes32 right) external override returns (bytes32 success, bytes32 result) {
        result = bytes32(uint256(left) * uint256(right));
        success = bytes32(uint256(1));
        emit SafeMul(msg.sender, left, right, success, result);
    }

    function safeDiv(bytes32 numerator, bytes32 denominator) external override returns (bytes32 success, bytes32 result) {
        if (uint256(denominator) == 0) {
            result = bytes32(uint256(0));
            success = bytes32(uint256(0));
        } else {
            result = bytes32(uint256(numerator) / uint256(denominator));
            success = bytes32(uint256(1));
        }
        emit SafeDiv(msg.sender, numerator, denominator, success, result);
    }

    function select(bytes32 condition, bytes32 ifTrue, bytes32 ifFalse) external override returns (bytes32) {
        bytes32 result = uint256(condition) != 0 ? ifTrue : ifFalse;
        emit Select(msg.sender, condition, ifTrue, ifFalse, result);
        return result;
    }

    function eq(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(left == right ? 1 : 0));
        emit Eq(msg.sender, left, right, result);
    }

    function ne(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(left != right ? 1 : 0));
        emit Ne(msg.sender, left, right, result);
    }

    function lt(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(uint256(left) < uint256(right) ? 1 : 0));
        emit Lt(msg.sender, left, right, result);
    }

    function le(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(uint256(left) <= uint256(right) ? 1 : 0));
        emit Le(msg.sender, left, right, result);
    }

    function gt(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(uint256(left) > uint256(right) ? 1 : 0));
        emit Gt(msg.sender, left, right, result);
    }

    function ge(bytes32 left, bytes32 right) external override returns (bytes32 result) {
        result = bytes32(uint256(uint256(left) >= uint256(right) ? 1 : 0));
        emit Ge(msg.sender, left, right, result);
    }

    // ── Balance operations ────────────────────────────────────────────────

    function transfer(
        bytes32 balanceFrom,
        bytes32 balanceTo,
        bytes32 amount
    ) external override returns (bytes32 success, bytes32 newBalanceFrom, bytes32 newBalanceTo) {
        uint256 from = uint256(balanceFrom);
        uint256 to = uint256(balanceTo);
        uint256 amt = uint256(amount);

        if (from >= amt) {
            newBalanceFrom = bytes32(from - amt);
            newBalanceTo = bytes32(to + amt);
            success = bytes32(uint256(1));
        } else {
            newBalanceFrom = balanceFrom;
            newBalanceTo = balanceTo;
            success = bytes32(uint256(0));
        }
        emit Transfer(msg.sender, balanceFrom, balanceTo, amount, success, newBalanceFrom, newBalanceTo);
    }

    function mint(
        bytes32 balanceTo,
        bytes32 amount,
        bytes32 totalSupply
    ) external override returns (bytes32 success, bytes32 newBalanceTo, bytes32 newTotalSupply) {
        newBalanceTo = bytes32(uint256(balanceTo) + uint256(amount));
        newTotalSupply = bytes32(uint256(totalSupply) + uint256(amount));
        success = bytes32(uint256(1));
        emit Mint(msg.sender, balanceTo, amount, totalSupply, success, newBalanceTo, newTotalSupply);
    }

    function burn(
        bytes32 balanceFrom,
        bytes32 amount,
        bytes32 totalSupply
    ) external override returns (bytes32 success, bytes32 newBalanceFrom, bytes32 newTotalSupply) {
        uint256 from = uint256(balanceFrom);
        uint256 amt = uint256(amount);
        if (from >= amt) {
            newBalanceFrom = bytes32(from - amt);
            newTotalSupply = bytes32(uint256(totalSupply) - amt);
            success = bytes32(uint256(1));
        } else {
            newBalanceFrom = balanceFrom;
            newTotalSupply = totalSupply;
            success = bytes32(uint256(0));
        }
        emit Burn(msg.sender, balanceFrom, amount, totalSupply, success, newBalanceFrom, newTotalSupply);
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    function setKmsPublicKey(bytes calldata) external override {}
    function setGateway(address) external override {}
    function setProofExpirationDuration(uint256) external override {}
    function kmsPublicKey() external pure override returns (bytes memory) { return ""; }
    function gateway() external pure override returns (address) { return address(0); }
    function proofExpirationDuration() external pure override returns (uint256) { return 3600; }
}

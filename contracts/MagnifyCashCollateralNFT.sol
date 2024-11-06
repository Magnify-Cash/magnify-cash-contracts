// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.28;

// Developed with OpenZeppelin Contracts 5.1.0.
import {
    Initializable,
    ERC721Upgradeable,
    ERC721PausableUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import { IMagnifyCashSBT } from "./interfaces/IMagnifyCashSBT.sol";

/**
 * @title The Magnify Cash collateral NFT.
 *
 * @notice This contract is the collateral non-fungible token of the Magnify Cash platform.
 *
 * The basic flow is that a collateral NFT is minted to an account for its non-transferable SBT after
 * account's verification via a KYC mechanism, then it is used as a collateral when borrowing a loan through
 * the Magnify Cash Telegram bot.
 *
 * There is only one collateral NFT per account and only one collateral NFT per SBT.
 *
 * This contract includes the basic ERC721 functionality.
 *
 * The default admin address specified for contract creation is granted the default admin role.
 */
contract MagnifyCashCollateralNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721PausableUpgradeable,
    AccessControlUpgradeable
{
    // _______________ Constants _______________

    /// @notice The version of this contract. It is to be changed if upgrading.
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    /// @notice The role of a pauser, who is responsible for pausing and unpausing all token transfers.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice The role of a back end, that is responsible for minting SBTs (i.e. verifying accounts).
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    // _______________ Storage _______________

    /// @notice The URI based on which token URIs are computed by concatenating it with token IDs.
    string public baseURI;

    /// @notice The SBT contract which is used when minting to get an SBT ID of an account.
    IMagnifyCashSBT public sbt;

    /**
     * @notice An ID for a next collateral token to be minted.
     *
     * @dev It is started from `1`, because `0` is used to mean an ID does not exist.
     */
    uint256 public nextCollateralID;

    /// @notice A collateral token ID by an SBT ID `_sbtID`.
    mapping(uint256 _sbtID => uint256) public collateralBySBT;

    /// @notice An SBT ID by a collateral token ID `_collateralID`.
    mapping(uint256 _collateralID => uint256) public sbtByCollateral;

    // _______________ Events ______________

    /// @notice Generated when the address of the SBT is set to `sbt`.
    event SBTSet(address sbt);

    /// @notice Generated when the base URI is set to `uri`.
    event BaseURISet(string uri);

    // _______________ Errors ______________

    /// @notice Reverted if a passed address is the zero address.
    error ZeroAddress();

    /// @notice Reverted when setting the base URI if a passed URI is empty.
    error EmptyURI();

    /// @notice Reverted when minting to an `account` which has not an SBT.
    error AccountHasNotSBT(address account);

    /// @notice Reverted when minting if an `account` has a collateral NFT with `collateralID`.
    error AccountHasCollateral(address account, uint256 collateralID);

    // _______________ Initialization ______________

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); } // prettier-ignore

    /**
     * @notice Initializes this contract by:
     * - setting the token name and symbol;
     * - granting the role `DEFAULT_ADMIN_ROLE` to `_defaultAdmin`;
     * - setting the address of the SBT contract to `_sbt`.
     *
     * Emits an `SBTSet` event.
     *
     * Requirements:
     * - `_defaultAdmin` should not be the zero address.
     * - `_sbt` should not be the zero address.
     */
    function initialize(address _defaultAdmin, address _sbt) external initializer {
        __ERC721_init("MAGBot ID", "MBID");
        __ERC721Pausable_init();
        __AccessControl_init();

        if (_defaultAdmin == address(0)) revert ZeroAddress();
        if (_sbt == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);

        sbt = IMagnifyCashSBT(_sbt);
        emit SBTSet(_sbt);

        nextCollateralID = 1; // `0` is used to mean an ID does not exist.
    }

    // _______________ External functions _______________

    /**
     * @notice Mints a new collateral NFT to `_to` and returns the ID of a minted NFT.
     *
     * Emits a `Transfer` event.
     *
     * Requirements:
     * - The caller should have the backend role (`BACKEND_ROLE`).
     * - `_to` should have an SBT.
     * - `_to` should not have a collateral NFT.
     * - `_to` should not be the zero address.
     * - If `_to` refers to a contract, it should implement `IERC721Receiver.onERC721Received`,
     *   which is called upon a safe transfer.
     *
     * @param _to An address to whom the minted collateral NFT is transferred.
     *
     * @return collateralID An identifier of a newly minted collateral NFT.
     *
     * @notice It is used as a collateral when borrowing a loan through the Magnify Cash Telegram bot.
     */
    function mint(address _to) external onlyRole(BACKEND_ROLE) returns (uint256 collateralID) {
        collateralID = nextCollateralID++; // `nextCollateralID` is incremented in this instruction.

        uint256 sbtID = sbt.tokenByAccount(_to);
        if (sbtID == 0) revert AccountHasNotSBT(_to);

        if (collateralBySBT[sbtID] != 0) revert AccountHasCollateral(_to, collateralBySBT[sbtID]);

        _safeMint(_to, collateralID);

        collateralBySBT[sbtID] = collateralID;
        sbtByCollateral[collateralID] = sbtID;

        return collateralID;
    }

    /**
     * @notice Sets the base URI to `_uri`. See `baseURI` for details.
     *
     * Emits a `BaseURISet` event.
     *
     * Requirements:
     * - The caller should have the backend role (`DEFAULT_ADMIN_ROLE`).
     * - `_uri` should not be empty.
     */
    function setBaseURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_uri).length == 0) revert EmptyURI();

        baseURI = _uri;
        emit BaseURISet(_uri);
    }

    /**
     * @notice Sets the address of the SBT contract to `_sbt`. See `sbt` for details.
     *
     * Emits an `SBTSet` event.
     *
     * Requirements:
     * - The caller should have the backend role (`DEFAULT_ADMIN_ROLE`).
     * - `_sbt` should not be the zero address.
     */
    function setSBT(address _sbt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_sbt == address(0)) revert ZeroAddress();

        sbt = IMagnifyCashSBT(_sbt);
        emit SBTSet(_sbt);
    }

    /**
     * @notice Pauses all token transfers.
     *
     * Emits a `Paused` event.
     *
     * Requirements:
     * - The caller should have the role `PAUSER_ROLE`.
     * - The contract should not be paused.
     */
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); } // prettier-ignore

    /**
     * @notice Unpauses all token transfers.
     *
     * Emits an `Unpaused` event.
     *
     * Requirements:
     * - The caller should have the role `PAUSER_ROLE`.
     * - The contract should be paused.
     */
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); } // prettier-ignore

    // _______________ Internal functions _______________

    /// @notice Returns the base URI for computing token URIs.
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // _______________ Overrides required by Solidity _______________

    function supportsInterface(
        bytes4 _interfaceID
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(_interfaceID);
    }

    function _update(
        address _to,
        uint256 _tokenID,
        address _auth
    ) internal override(ERC721Upgradeable, ERC721PausableUpgradeable) returns (address) {
        return super._update(_to, _tokenID, _auth);
    }
}

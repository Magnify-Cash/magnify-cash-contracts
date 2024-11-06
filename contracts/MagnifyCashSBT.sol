// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.28;

// Developed with OpenZeppelin Contracts 5.1.0.
import {
    Initializable,
    ERC721Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title The Magnify Cash soulbound token (SBT).
 *
 * @notice This contract is the soulbound token of the Magnify Cash platform. It is minted as proof of successful
 * verification via a KYC mechanism of an account on the platform.
 * Once minted this token can not be transferred or burnt, i.e. transfers between accounts are permanently blocked.
 *
 * There is only one SBT per account and only one verification per SBT.
 *
 * The basic flow is that a verified account authorizes in the Magnify Cash Telegram bot to borrow a loan.
 * To do so, such an account uses the Magnify Cash collateral NFT linked to this SB token.
 *
 * This contract includes the basic ERC721 functionality, except token transfers between accounts,
 * as well as the following:
 * - Minting of SB tokens and preventing of token transfers between accounts.
 * - Setting of the URI based on which token URIs are computed by concatenating it with token IDs.
 * - A default admin role that allows to grant any roles to other addresses and set the base URI.
 * - A back end role that allows to mint SB tokens.
 * - Getting of the base URI.
 * - Getting of an SBT of an account.
 * - Getting of verification details by an SBT ID.
 * - Getting of an SBT ID by verification details.
 * - Getting of verification details by an account.
 * - Getting of an account by verification details.
 * - Getting of a verification status of an account.
 * - Getting of the ID of the next SB token to be minted.
 *
 * The default admin address specified for contract creation is granted the default admin role.
 */
contract MagnifyCashSBT is Initializable, ERC721Upgradeable, AccessControlUpgradeable {
    // _______________ Constants _______________

    /// @notice The version of this contract. It is to be changed if upgrading.
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    /// @notice The role of a back end, that is responsible for minting SBTs (i.e. verifying accounts).
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    // _______________ Storage _______________

    /// @notice The URI based on which token URIs are computed by concatenating it with token IDs.
    string public baseURI;

    /**
     * @notice An ID for a next SB token to be minted.
     *
     * @dev It is started from `1`, because `0` is used to mean an ID does not exist.
     */
    uint256 public nextTokenID;

    /// @notice A token ID by an account `_account`.
    mapping(address _account => uint256) public tokenByAccount;

    /// @notice Verification data by a token ID `_tokenID`.
    mapping(uint256 _tokenID => string) public verificationByToken;

    /// @notice A token ID by verification data `_verification`.
    mapping(string _verification => uint256) public tokenByVerification;

    // _______________ Events ______________

    /// @notice Generated when the base URI is set to `uri`.
    event BaseURISet(string uri);

    // _______________ Errors _______________

    /// @notice Reverted if a passed address is the zero address.
    error ZeroAddress();

    /// @notice Reverted when setting the base URI if a passed URI is empty.
    error EmptyURI();

    /// @notice Reverted when minting if passed verification data is an empty string.
    error EmptyData();

    /// @notice Reverted when attempting to transfer an existing SB token.
    error NonTransferable();

    /// @notice Reverted when minting to an `account` which has an SBT with `tokenID`.
    error AlreadyVerified(address account, uint256 tokenID);

    /// @notice Reverted when minting if passed verification data has already been used for an SBT with `tokenID`.
    error DataAlreadySetFor(uint256 tokenID);

    /// @notice Reverted when getting verification data for `account` without an SB token.
    error UnknownAccount(address account);

    /// @notice Reverted when getting an account for non-existent verification data.
    error UnknownVerification();

    // _______________ Initialization ______________

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); } // prettier-ignore

    /**
     * @notice Initializes this contract by setting the token name, symbol and granting the role `DEFAULT_ADMIN_ROLE`
     * to `_defaultAdmin`.
     *
     * Requirements:
     * - `_defaultAdmin` should not be the zero address.
     */
    function initialize(address _defaultAdmin) external initializer {
        __ERC721_init("MAGBot SBT", "MBSBT");
        __AccessControl_init();

        if (_defaultAdmin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);

        nextTokenID = 1; // `0` is used to mean an ID does not exist.
    }

    // _______________ External functions _______________

    /**
     * @notice Mints a new SBT to `_to`, writes the verification data `_data` and returns the ID of a minted SBT.
     *
     * Emits a `Transfer` event.
     *
     * Requirements:
     * - The caller should have the backend role (`BACKEND_ROLE`).
     * - `_data` should not be empty.
     * - `_to` should not have an SBT.
     * - `_data` should not be already set to another SBT.
     * - `_to` should not be the zero address.
     * - If `_to` refers to a contract, it should implement `IERC721Receiver.onERC721Received`,
     *   which is called upon a safe transfer.
     *
     * @param _to An address to whom the minted SBT is transferred and which is verified.
     * @param _data Data that stores details about verification of `_to`.
     *
     * @return   An identifier of a newly minted STB.
     *
     * @notice This token is minted as proof of successful account verification on the Magnify Cash platform.
     * After verification the account can authorize in the Magnify Cash Telegram bot to borrow a loan.
     * To borrow the account uses the Magnify Cash collateral NFT which is linked to the SBT.
     */
    function mint(address _to, string calldata _data) external onlyRole(BACKEND_ROLE) returns (uint256) {
        if (bytes(_data).length == 0) revert EmptyData();

        if (tokenByAccount[_to] != 0) revert AlreadyVerified(_to, tokenByAccount[_to]);
        if (tokenByVerification[_data] != 0) revert DataAlreadySetFor(tokenByVerification[_data]);

        uint256 tokenID = nextTokenID++; // `nextTokenID` is incremented in this instruction.
        _safeMint(_to, tokenID);

        tokenByAccount[_to] = tokenID;
        verificationByToken[tokenID] = _data;
        tokenByVerification[_data] = tokenID;

        return tokenID;
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
     * Returns verification data by an account `_account`.
     *
     * Requirements:
     * - `_account` should have an SBT.
     */
    function verificationByAccount(address _account) external view returns (string memory) {
        uint256 tokenID = tokenByAccount[_account];
        if (tokenID == 0) revert UnknownAccount(_account);

        return verificationByToken[tokenID];
    }

    /**
     * @notice Returns verification data by an account `_account`.
     *
     * Requirements:
     * - An SBT for `_data` should exist.
     */
    function accountByVerification(string calldata _data) external view returns (address) {
        uint256 tokenID = tokenByVerification[_data];
        if (tokenID == 0) revert UnknownVerification();

        return ownerOf(tokenID);
    }

    /// @notice Returns `true` if `_account` has an SBT.
    function verified(address _account) external view returns (bool) {
        return tokenByAccount[_account] != 0;
    }

    // _______________ Internal functions _______________

    /// @notice Override to block transfers.
    function _update(address _to, uint256 _tokenID, address _auth) internal override returns (address) {
        if (_ownerOf(_tokenID) != address(0)) revert NonTransferable();
        return super._update(_to, _tokenID, _auth);
    }

    /// @notice Returns the base URI for computing token URIs.
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // _______________ Overrides required by Solidity _______________

    function supportsInterface(
        bytes4 _interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(_interfaceId);
    }
}

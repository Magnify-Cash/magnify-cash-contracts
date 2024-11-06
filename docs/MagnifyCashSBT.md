# Solidity API

## MagnifyCashSBT

This contract is the soulbound token of the Magnify Cash platform. It is minted as proof of successful
verification via a KYC mechanism of an account on the platform.
Once minted this token can not be transferred or burnt, i.e. transfers between accounts are permanently blocked.

There is only one SBT per account and only one verification per SBT.

The basic flow is that a verified account authorizes in the Magnify Cash Telegram bot to borrow a loan.
To do so, such an account uses the Magnify Cash collateral NFT linked to this SB token.

This contract includes the basic ERC721 functionality, except token transfers between accounts,
as well as the following:

- Minting of SB tokens and preventing of token transfers between accounts.
- Setting of the URI based on which token URIs are computed by concatenating it with token IDs.
- A default admin role that allows to grant any roles to other addresses and set the base URI.
- A back end role that allows to mint SB tokens.
- Getting of the base URI.
- Getting of an SBT of an account.
- Getting of verification details by an SBT ID.
- Getting of an SBT ID by verification details.
- Getting of verification details by an account.
- Getting of an account by verification details.
- Getting of a verification status of an account.
- Getting of the ID of the next SB token to be minted.

The default admin address specified for contract creation is granted the default admin role.

### version

```solidity
string version
```

The version of this contract. It is to be changed if upgrading.

### BACKEND_ROLE

```solidity
bytes32 BACKEND_ROLE
```

The role of a back end, that is responsible for minting SBTs (i.e. verifying accounts).

### baseURI

```solidity
string baseURI
```

The URI based on which token URIs are computed by concatenating it with token IDs.

### nextTokenID

```solidity
uint256 nextTokenID
```

An ID for a next SB token to be minted.

_It is started from `1`, because `0` is used to mean an ID does not exist._

### tokenByAccount

```solidity
mapping(address => uint256) tokenByAccount
```

A token ID by an account `_account`.

### verificationByToken

```solidity
mapping(uint256 => string) verificationByToken
```

Verification data by a token ID `_tokenID`.

### tokenByVerification

```solidity
mapping(string => uint256) tokenByVerification
```

A token ID by verification data `_verification`.

### BaseURISet

```solidity
event BaseURISet(string uri)
```

Generated when the base URI is set to `uri`.

### ZeroAddress

```solidity
error ZeroAddress()
```

Reverted if a passed address is the zero address.

### EmptyURI

```solidity
error EmptyURI()
```

Reverted when setting the base URI if a passed URI is empty.

### EmptyData

```solidity
error EmptyData()
```

Reverted when minting if passed verification data is an empty string.

### NonTransferable

```solidity
error NonTransferable()
```

Reverted when attempting to transfer an existing SB token.

### AlreadyVerified

```solidity
error AlreadyVerified(address account, uint256 tokenID)
```

Reverted when minting to an `account` which has an SBT with `tokenID`.

### DataAlreadySetFor

```solidity
error DataAlreadySetFor(uint256 tokenID)
```

Reverted when minting if passed verification data has already been used for an SBT with `tokenID`.

### UnknownAccount

```solidity
error UnknownAccount(address account)
```

Reverted when getting verification data for `account` without an SB token.

### UnknownVerification

```solidity
error UnknownVerification()
```

Reverted when getting an account for non-existent verification data.

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _defaultAdmin) external
```

Initializes this contract by setting the token name, symbol and granting the role `DEFAULT_ADMIN_ROLE`
to `_defaultAdmin`.

Requirements:

- `_defaultAdmin` should not be the zero address.

### mint

```solidity
function mint(address _to, string _data) external returns (uint256)
```

Mints a new SBT to `_to`, writes the verification data `_data` and returns the ID of a minted SBT.

Emits a `Transfer` event.

Requirements:

- The caller should have the backend role (`BACKEND_ROLE`).
- `_data` should not be empty.
- `_to` should not have an SBT.
- `_data` should not be already set to another SBT.
- `_to` should not be the zero address.
- If `_to` refers to a contract, it should implement `IERC721Receiver.onERC721Received`,
  which is called upon a safe transfer.

This token is minted as proof of successful account verification on the Magnify Cash platform.
After verification the account can authorize in the Magnify Cash Telegram bot to borrow a loan.
To borrow the account uses the Magnify Cash collateral NFT which is linked to the SBT.

#### Parameters

| Name   | Type    | Description                                                             |
| ------ | ------- | ----------------------------------------------------------------------- |
| \_to   | address | An address to whom the minted SBT is transferred and which is verified. |
| \_data | string  | Data that stores details about verification of `_to`.                   |

#### Return Values

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| [0]  | uint256 | An identifier of a newly minted STB. |

### setBaseURI

```solidity
function setBaseURI(string _uri) external
```

Sets the base URI to `_uri`. See `baseURI` for details.

Emits a `BaseURISet` event.

Requirements:

- The caller should have the backend role (`DEFAULT_ADMIN_ROLE`).
- `_uri` should not be empty.

### verificationByAccount

```solidity
function verificationByAccount(address _account) external view returns (string)
```

Returns verification data by an account `_account`.

Requirements:

- `_account` should have an SBT.

### accountByVerification

```solidity
function accountByVerification(string _data) external view returns (address)
```

Returns verification data by an account `_account`.

Requirements:

- An SBT for `_data` should exist.

### verified

```solidity
function verified(address _account) external view returns (bool)
```

Returns `true` if `_account` has an SBT.

### \_update

```solidity
function _update(address _to, uint256 _tokenID, address _auth) internal returns (address)
```

Override to block transfers.

### \_baseURI

```solidity
function _baseURI() internal view returns (string)
```

Returns the base URI for computing token URIs.

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) public view returns (bool)
```

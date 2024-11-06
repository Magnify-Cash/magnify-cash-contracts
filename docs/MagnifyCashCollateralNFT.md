# Solidity API

## MagnifyCashCollateralNFT

This contract is the collateral non-fungible token of the Magnify Cash platform.

The basic flow is that a collateral NFT is minted to an account for its non-transferable SBT after
account's verification via a KYC mechanism, then it is used as a collateral when borrowing a loan through
the Magnify Cash Telegram bot.

There is only one collateral NFT per account and only one collateral NFT per SBT.

This contract includes the basic ERC721 functionality.

The default admin address specified for contract creation is granted the default admin role.

### version

```solidity
string version
```

The version of this contract. It is to be changed if upgrading.

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

The role of a pauser, who is responsible for pausing and unpausing all token transfers.

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

### sbt

```solidity
contract IMagnifyCashSBT sbt
```

The SBT contract which is used when minting to get an SBT ID of an account.

### nextCollateralID

```solidity
uint256 nextCollateralID
```

An ID for a next collateral token to be minted.

_It is started from `1`, because `0` is used to mean an ID does not exist._

### collateralBySBT

```solidity
mapping(uint256 => uint256) collateralBySBT
```

A collateral token ID by an SBT ID `_sbtID`.

### sbtByCollateral

```solidity
mapping(uint256 => uint256) sbtByCollateral
```

An SBT ID by a collateral token ID `_collateralID`.

### SBTSet

```solidity
event SBTSet(address sbt)
```

Generated when the address of the SBT is set to `sbt`.

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

### AccountHasNotSBT

```solidity
error AccountHasNotSBT(address account)
```

Reverted when minting to an `account` which has not an SBT.

### AccountHasCollateral

```solidity
error AccountHasCollateral(address account, uint256 collateralID)
```

Reverted when minting if an `account` has a collateral NFT with `collateralID`.

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _defaultAdmin, address _sbt) external
```

Initializes this contract by:

- setting the token name and symbol;
- granting the role `DEFAULT_ADMIN_ROLE` to `_defaultAdmin`;
- setting the address of the SBT contract to `_sbt`.

Emits an `SBTSet` event.

Requirements:

- `_defaultAdmin` should not be the zero address.
- `_sbt` should not be the zero address.

### mint

```solidity
function mint(address _to) external returns (uint256 collateralID)
```

Mints a new collateral NFT to `_to` and returns the ID of a minted NFT.

Emits a `Transfer` event.

Requirements:

- The caller should have the backend role (`BACKEND_ROLE`).
- `_to` should have an SBT.
- `_to` should not have a collateral NFT.
- `_to` should not be the zero address.
- If `_to` refers to a contract, it should implement `IERC721Receiver.onERC721Received`,
  which is called upon a safe transfer.

It is used as a collateral when borrowing a loan through the Magnify Cash Telegram bot.

#### Parameters

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| \_to | address | An address to whom the minted collateral NFT is transferred. |

#### Return Values

| Name         | Type    | Description                                     |
| ------------ | ------- | ----------------------------------------------- |
| collateralID | uint256 | An identifier of a newly minted collateral NFT. |

### setBaseURI

```solidity
function setBaseURI(string _uri) external
```

Sets the base URI to `_uri`. See `baseURI` for details.

Emits a `BaseURISet` event.

Requirements:

- The caller should have the backend role (`DEFAULT_ADMIN_ROLE`).
- `_uri` should not be empty.

### setSBT

```solidity
function setSBT(address _sbt) external
```

Sets the address of the SBT contract to `_sbt`. See `sbt` for details.

Emits an `SBTSet` event.

Requirements:

- The caller should have the backend role (`DEFAULT_ADMIN_ROLE`).
- `_sbt` should not be the zero address.

### pause

```solidity
function pause() external
```

Pauses all token transfers.

Emits a `Paused` event.

Requirements:

- The caller should have the role `PAUSER_ROLE`.
- The contract should not be paused.

### unpause

```solidity
function unpause() external
```

Unpauses all token transfers.

Emits an `Unpaused` event.

Requirements:

- The caller should have the role `PAUSER_ROLE`.
- The contract should be paused.

### \_baseURI

```solidity
function _baseURI() internal view returns (string)
```

Returns the base URI for computing token URIs.

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceID) public view returns (bool)
```

### \_update

```solidity
function _update(address _to, uint256 _tokenID, address _auth) internal returns (address)
```

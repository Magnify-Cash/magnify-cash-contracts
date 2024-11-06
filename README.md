# Magnify Cash contracts

## Installation

Prerequisites: install [Node.js](https://nodejs.org/en/download/package-manager) 20.11+ or 21.2+ and [Visual Studio Code](https://code.visualstudio.com/download).

Open [the root of the project](./) using Visual Studio Code and install all the extensions recommended by notifications of Visual Studio Code, then restart Visual Studio Code.

Open the terminal and run the command below to install all the dependencies and prepare the project:

```shell
npm i
```

## Deployment

### 1. Setting environment

After [installation](#installation), create the file [`.env`](./.env) at [the root of the project](./).

This can be done by running:

```shell
cp .env.example .env
```

Set the following environment variables by adding them to the [`.env`](./.env) file:

1. `BASE_MAINNET_KEYS` is a private key of an externally-owned account (EOA), which is used as the deployer of contracts.

   Example:

   ```
   BASE_MAINNET_KEYS = "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1"
   ```

   _A new account can be created using [MetaMask](https://metamask.io/)._

   **_This account is granted the default admin role on all the contracts, giving it the ability to grant the back end role to a back end, setting essential parameters on the contracts, etc._**

2. `BASE_URL` is a URL used to connect to an external node of Base Mainnet. Such a URL with a **free** API key can be obtained from a third-party provider, like [Alchemy](https://www.alchemy.com/support/how-to-create-a-new-alchemy-api-key) or [Infura](https://docs.infura.io/dashboard/create-api).

   Example:

   ```
   BASE_URL = "https://base-mainnet.g.alchemy.com/v2/Abc123aBC123AbC123abC123abc123AB"
   ```

3. `BASESCAN_API_KEY` is [a **free** BaseScan API key](https://docs.basescan.org/getting-started/viewing-api-usage-statistics) used to verify the contracts in [the BaseScan block explorer](https://basescan.org/).

   Example:

   ```
   BASESCAN_API_KEY = "ABC123ABC123ABC123ABC123ABC123ABC1"
   ```

### 2. Deploying all the contracts

Run the following command to deploy all the contracts on Base Chain Mainnet:

```shell
npm run deploy:all:base-mainnet
```

### 3. Post-deployment preparation for use

Grant the back end role to your back end (application) account on the SBT and Collateral NFT contracts. **A back end can not mint tokens without this role.**

To do this:

1. If you do not have an account (wallet) for your back end (application) yet, create one.

   _For example, it can be created with [the Coinbase wallet](https://wallet.coinbase.com/) or [Chrome extension](https://www.coinbase.com/ru/wallet/articles/getting-started-extension)._

2. Run the following commands:

   ```shell
   npx hardhat --network base-mainnet grant-backend MagnifyCashSBT --account <backend-account-address>
   ```

   ```shell
   npx hardhat --network base-mainnet grant-backend MagnifyCashSBT --account <backend-account-address>
   ```

   Example:

   ```
   npx hardhat --network base-mainnet grant-backend MagnifyCashSBT --account 0xREPLACE000000000000000000000000000000000
   ```

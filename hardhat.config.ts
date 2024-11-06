/* eslint @typescript-eslint/no-non-null-assertion: ["off"] */

import dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-solhint";
import "solidity-coverage";
import "solidity-docgen";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import "hardhat-tracer";

const envs = process.env;

// Private keys can be set in `.env` file.
const ethereumMainnetKeys = envs.ETHEREUM_MAINNET_KEYS?.split(",") ?? [];
const ethereumTestnetKeys = envs.ETHEREUM_TESTNET_KEYS?.split(",") ?? [];

/*
 * The solc compiler optimizer is disabled by default to keep the Hardhat stack traces' line numbers the same.
 * To enable, set `RUN_OPTIMIZER` to `true` in the `.env` file.
 */
const optimizerRuns = ["true", "1"].includes(envs.RUN_OPTIMIZER ?? "") || ["true", "1"].includes(envs.REPORT_GAS ?? "");
const optimizerRunNum = envs.OPTIMIZER_RUN_NUM ? +envs.OPTIMIZER_RUN_NUM : 200;

const enableForking = ["true", "1"].includes(envs.FORKING ?? "");
const networkHardfork = enableForking ? envs.HARDFORK : envs.HARDFORK ? envs.HARDFORK : "cancun";

const serial = ["true", "1"].includes(envs.SERIAL ?? "");

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.28",
                settings: {
                    viaIR: optimizerRuns,
                    optimizer: {
                        enabled: optimizerRuns,
                        runs: optimizerRunNum,
                        details: {
                            yulDetails: {
                                optimizerSteps: optimizerRuns ? "u" : undefined
                            }
                        }
                    },
                    // Set to "paris" for chains that do not support the `PUSH0` opcode, such as Polygon, etc.
                    evmVersion: "cancun"
                }
            }
            // { version: "0.7.6" }
        ]
        // overrides: { "contracts/Deployed.sol": { version: "0.8.21" } }
    },
    // defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            allowUnlimitedContractSize: !optimizerRuns,
            accounts: {
                accountsBalance: envs.ACCOUNT_BALANCE ?? "10000000000000000000000", // 10000 ETH.
                count: envs.NUMBER_OF_ACCOUNTS ? +envs.NUMBER_OF_ACCOUNTS : 20
            },
            forking: {
                url: envs.FORKING_URL ?? "",
                enabled: enableForking
            },
            hardfork: networkHardfork
            // Uncomment if "Error: cannot estimate gas; transaction may fail or may require manual gas limit...".
            // gas: 3E7,
            // gasPrice: 8E9
        },
        // Ethereum:
        ethereum: {
            chainId: 1,
            url: envs.ETHEREUM_URL ?? "",
            accounts: [...ethereumMainnetKeys]
        },
        sepolia: {
            chainId: 11155111,
            url: envs.SEPOLIA_URL ?? "",
            accounts: [...ethereumTestnetKeys]
        },
        holesky: {
            chainId: 17000,
            url: envs.HOLESKY_URL ?? "",
            accounts: [...ethereumTestnetKeys]
        }
    },
    etherscan: {
        /*
         * This is not necessarily the same name that is used to define the network.
         * To see the full list of supported networks, run `$ npx hardhat verify --list-networks`. The identifiers
         * shown there are the ones that should be used as keys in the `apiKey` object.
         *
         * See the link for details:
         * `https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#multiple-api-keys-and-alternative-block-explorers`.
         */
        apiKey: {
            mainnet: envs.ETHERSCAN_API_KEY ?? "",
            sepolia: envs.ETHERSCAN_API_KEY ?? "",
            holesky: envs.ETHERSCAN_API_KEY ?? ""
        }
    },
    gasReporter: {
        enabled: envs.REPORT_GAS !== undefined,
        excludeContracts: ["vendor/"],
        // currency: "USD", // "CHF", "EUR", etc.
        showMethodSig: true,
        L1Etherscan: envs.ETHERSCAN_API_KEY ?? ""
    },
    docgen: {
        pages: "files",
        exclude: ["vendor/"]
    },
    contractSizer: {
        except: ["mocks/", "vendor/"]
    },
    abiExporter: {
        except: ["interfaces/", "mocks/", "vendor/"],
        spacing: 4
    },
    mocha: {
        timeout: 40000,
        parallel: !serial
        // bail: true // Aborts after the first failure.
    }
};

// By default fork from the latest block.
if (envs.FORKING_BLOCK_NUMBER) config.networks!.hardhat!.forking!.blockNumber = +envs.FORKING_BLOCK_NUMBER;

// Extra settings for `hardhat-gas-reporter`.
if (envs.COINMARKETCAP_API_KEY) config.gasReporter!.coinmarketcap = envs.COINMARKETCAP_API_KEY;
if (envs.REPORT_GAS_TO_FILE === "md") {
    config.gasReporter!.outputFile = "gas-report.md";
    config.gasReporter!.reportFormat = "markdown";
    config.gasReporter!.forceTerminalOutput = true;
    config.gasReporter!.forceTerminalOutputFormat = "terminal";
}
if (envs.REPORT_GAS_TO_FILE === "json") {
    config.gasReporter!.outputJSON = true;
    config.gasReporter!.outputJSONFile = "gas-report.json";
    config.gasReporter!.includeBytecodeInJSON = true;
}

export default config;

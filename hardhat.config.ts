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
import "@openzeppelin/hardhat-upgrades";

import "./scripts/tasks/grant-backend-role";

const envs = process.env;

// Private keys can be set in `.env` file.
const baseMainnetKeys = envs.BASE_MAINNET_KEYS?.split(",") ?? [];
const baseTestnetKeys = envs.BASE_TESTNET_KEYS?.split(",") ?? [];

const baseChainID = 8453;
const baseSepoliaChainID = 84532;
const baseGasPrice = 1000000000;

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
        // Base Chain:
        "base-mainnet": {
            chainId: baseChainID,
            url: envs.BASE_URL ?? "https://mainnet.base.org",
            accounts: [...baseMainnetKeys],
            gasPrice: baseGasPrice
        },
        "base-sepolia": {
            chainId: baseSepoliaChainID,
            url: envs.BASE_SEPOLIA_URL ?? "https://sepolia.base.org",
            accounts: [...baseTestnetKeys],
            gasPrice: baseGasPrice
        },
        "base-local": {
            url: "http://localhost:8545",
            accounts: [...baseTestnetKeys],
            gasPrice: baseGasPrice
        }
    },
    etherscan: {
        apiKey: {
            "base-mainnet": envs.BASESCAN_API_KEY ?? "",
            "base-sepolia": envs.BASESCAN_API_KEY ?? ""
        },
        customChains: [
            {
                network: "base-mainnet",
                chainId: baseChainID,
                urls: {
                    apiURL: "https://api.basescan.org/api",
                    browserURL: "https://basescan.org"
                }
            },
            {
                network: "base-sepolia",
                chainId: baseSepoliaChainID,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://sepolia.basescan.org"
                }
            }
        ]
    },
    gasReporter: {
        enabled: envs.REPORT_GAS !== undefined,
        excludeContracts: ["vendor/"],
        // currency: "USD", // "CHF", "EUR", etc.
        showMethodSig: true,
        L2: "base",
        // Required, because Base is an Optimism-based Ethereum layer-two chain.
        L1Etherscan: envs.ETHERSCAN_API_KEY ?? "",
        L2Etherscan: envs.BASESCAN_API_KEY ?? ""
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

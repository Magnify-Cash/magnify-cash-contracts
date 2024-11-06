import type { Network } from "hardhat/types";

function requireChainID(network: Network): number {
    if (!network.config.chainId) throw new Error("Error: the chain ID is specified");
    return network.config.chainId;
}

function requireBaseChain(network: Network) {
    switch (network.name) {
        case "base-mainnet":
        case "base-sepolia":
            break;
        default:
            throw new Error("Error: assumed to run only on `base-mainnet` or `base-sepolia`");
    }
}

export { requireChainID, requireBaseChain };

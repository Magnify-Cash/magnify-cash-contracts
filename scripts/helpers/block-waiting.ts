import type { HardhatRuntimeEnvironment } from "hardhat/types";

async function latestBlock(hre: HardhatRuntimeEnvironment): Promise<number> {
    const height = (await hre.network.provider.request({
        method: "eth_blockNumber",
        params: []
    })) as string;

    return parseInt(height, 16);
}

async function setNodeJSTimeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Waiting of `blockNumber` blocks.
async function waitBlockNumber(hre: HardhatRuntimeEnvironment, blockNumber = 10, log = true): Promise<void> {
    const networkName = hre.network.name;
    if (networkName === "hardhat" || networkName === "localhost") {
        if (log)
            console.log(
                `Skip of waiting of ${blockNumber.toString()} blocks on the Hardhat network or the localhost.\n`
            );
        return;
    }

    if (log) console.log(`Waiting of ${blockNumber.toString()} blocks...`);

    const currentBlock = await latestBlock(hre);
    do {
        await setNodeJSTimeout(5000); // Waiting of 5 seconds.
    } while ((await latestBlock(hre)) <= currentBlock + blockNumber); // Waiting of `blockNumber` blocks.

    if (log) console.log("Waited.\n");
}

export { latestBlock, waitBlockNumber };

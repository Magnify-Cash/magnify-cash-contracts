import { promises as fs } from "fs";

interface DeployedAddresses {
    "MagnifyCashSBT#MagnifyCashSBT"?: string;
    "MagnifyCashCollateralNFT#MagnifyCashCollateralNFT"?: string;
}

function isDeployedAddrKey(key: string): key is keyof DeployedAddresses {
    const keys = Object.keys({} as DeployedAddresses) as (keyof DeployedAddresses)[];
    return keys.includes(key as keyof DeployedAddresses);
}

async function readDeployedAddress(chainID: number, key: keyof DeployedAddresses): Promise<string> {
    try {
        const filePath = `ignition/deployments/chain-${chainID.toString()}/deployed_addresses.json`;
        const data = await fs.readFile(filePath, "utf8");
        const addresses = JSON.parse(data) as DeployedAddresses;

        if (!addresses[key]) throw new Error(`Error when reading a deployed address: \`${key}\` is not found`);

        return addresses[key];
    } catch (error) {
        const msg = "Error when reading a deployed address";
        console.error(`${msg}:`, error);
        throw new Error(msg);
    }
}

export { isDeployedAddrKey, readDeployedAddress };

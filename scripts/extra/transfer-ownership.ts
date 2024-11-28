import hre from "hardhat";
const { ethers, ignition, upgrades } = hre;

import { waitBlockNumber } from "../helpers";

import SBTModule from "../../ignition/modules/MagnifyCashSBT";
import CollateralNFTModule from "../../ignition/modules/MagnifyCashCollateralNFT";

import { MagnifyCashCollateralNFT, MagnifyCashSBT } from "../../typechain-types";

async function main() {
    const [deployer] = await ethers.getSigners();

    const newOwnerAddr = "0xcf208D1c7D31697bCB6ee23279162f4F2B3161Ed";

    const { sbt: mbsbtContract } = await ignition.deploy(SBTModule);
    const mbsbt = mbsbtContract as unknown as MagnifyCashSBT;
    const mbsbtAddr = await mbsbt.getAddress();

    const { collateralNFT: mbidContract } = await ignition.deploy(CollateralNFTModule);
    const mbid = mbidContract as unknown as MagnifyCashCollateralNFT;
    const mbidAddr = await mbid.getAddress();

    console.log("\nTransfer of the default admin roles...\n");

    const defaultAdmin = deployer;

    console.log(`Granting the default admin role for \`MBSBT\` to \`${newOwnerAddr}\`...`);
    await mbsbt.connect(defaultAdmin).grantRole(await mbsbt.DEFAULT_ADMIN_ROLE(), newOwnerAddr);
    console.log("Granted.\n");

    console.log(`Granting the default admin role for \`MBID\` to \`${newOwnerAddr}\`...`);
    await mbid.connect(defaultAdmin).grantRole(await mbid.DEFAULT_ADMIN_ROLE(), newOwnerAddr);
    console.log("Granted.\n");

    console.log(`Renouncing the default admin role of the previous owner for \`MBSBT\`...`);
    await mbsbt.connect(defaultAdmin).renounceRole(await mbsbt.DEFAULT_ADMIN_ROLE(), defaultAdmin);
    console.log("Renounced.\n");

    console.log(`Renouncing the default admin role of the previous owner for \`MBID\`...`);
    await mbid.connect(defaultAdmin).renounceRole(await mbid.DEFAULT_ADMIN_ROLE(), defaultAdmin);
    console.log("Renounced.\n");

    console.log("The default admin roles are transferred.\n");

    console.log("Transfer of ownerships to the proxy admins...\n");

    try {
        const currentOwner = deployer;

        const mbsbtProxyAdminAddr = await upgrades.erc1967.getAdminAddress(mbsbtAddr);
        const mbsbtProxyAdmin = await ethers.getContractAt("ProxyAdmin", mbsbtProxyAdminAddr);
        if ((await mbsbtProxyAdmin.owner()) !== currentOwner.address) {
            console.error(
                `Error: the owner of the proxy admin \`${mbsbtProxyAdminAddr}\` is ` +
                    `\`${await mbsbtProxyAdmin.owner()}\`, not \`${currentOwner.address}\`.\n`
            );
            process.exit(1);
        }

        const mbidProxyAdminAddr = await upgrades.erc1967.getAdminAddress(mbidAddr);
        const mbidProxyAdmin = await ethers.getContractAt("ProxyAdmin", mbidProxyAdminAddr);
        if ((await mbidProxyAdmin.owner()) !== currentOwner.address) {
            console.error(
                `Error: the owner of the proxy admin \`${mbidProxyAdminAddr}\` is ` +
                    `\`${await mbidProxyAdmin.owner()}\`, not \`${currentOwner.address}\`.\n`
            );
            process.exit(1);
        }

        await upgrades.admin.transferProxyAdminOwnership(mbsbtAddr, newOwnerAddr, currentOwner);
        await upgrades.admin.transferProxyAdminOwnership(mbidAddr, newOwnerAddr, currentOwner);

        await waitBlockNumber(hre);

        if ((await mbsbtProxyAdmin.owner()) !== newOwnerAddr) {
            console.error(
                `Error: the owner of the proxy admin \`${mbsbtProxyAdminAddr}\` is ` +
                    `\`${await mbsbtProxyAdmin.owner()}\`, not \`${newOwnerAddr}\`.\n`
            );
        }
        if ((await mbidProxyAdmin.owner()) !== newOwnerAddr) {
            console.error(
                `Error: the owner of the proxy admin \`${mbidProxyAdminAddr}\` is ` +
                    `\`${await mbidProxyAdmin.owner()}\`, not \`${newOwnerAddr}\`.\n`
            );
        }
    } catch (error) {
        console.error(error);
    }

    console.log("\nThe ownerships are transferred.\n");
}

// This pattern is recommended to be able to use async / await everywhere and properly handle errors.
main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

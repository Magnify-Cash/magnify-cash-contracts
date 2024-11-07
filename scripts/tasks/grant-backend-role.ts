// This script contains the tasks for granting the backend role of `MagnifyCashSBT` and `MagnifyCashCollateralNFT`.

import { scope } from "hardhat/config";

import SBTModule from "../../ignition/modules/MagnifyCashSBT";
import CollateralNFTModule from "../../ignition/modules/MagnifyCashCollateralNFT";
import { getParamByKey } from "../helpers";

import { MagnifyCashCollateralNFT, MagnifyCashSBT } from "../../typechain-types";

const grantingScope = scope("grant-backend", "Grant the backend role to a specified account");

grantingScope
    .task("MagnifyCashSBT", "Grant the backend role to a specified account")
    .addParam("account", "An account which is granted the backend role")
    .setAction(async (taskArgs, hre) => {
        const { run, ethers, ignition } = hre;
        await run("compile");

        const [defaultAdmin] = await ethers.getSigners();

        const { sbt: sbtContract } = await ignition.deploy(SBTModule);
        const sbt = sbtContract as unknown as MagnifyCashSBT;

        const backendAddress = getParamByKey(taskArgs as object, "account");
        await sbt.connect(defaultAdmin).grantRole(await sbt.BACKEND_ROLE(), backendAddress);

        console.log("\nGranted.\n");
    });

grantingScope
    .task("MagnifyCashCollateralNFT", "Grant the backend role to a specified account")
    .addParam("account", "An account which is granted the backend role")
    .setAction(async (taskArgs, hre) => {
        const { run, ethers, ignition } = hre;
        await run("compile");

        const [defaultAdmin] = await ethers.getSigners();

        const { collateralNFT: collateralNFTContract } = await ignition.deploy(CollateralNFTModule);
        const collateralNFT = collateralNFTContract as unknown as MagnifyCashCollateralNFT;

        const backendAddress = getParamByKey(taskArgs as object, "account");
        await collateralNFT.connect(defaultAdmin).grantRole(await collateralNFT.BACKEND_ROLE(), backendAddress);

        console.log("\nGranted.\n");
    });

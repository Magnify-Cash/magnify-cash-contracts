// This script contains the tasks for granting the backend role of `MagnifyCashSBT` and `MagnifyCashCollateralNFT`.

import { scope } from "hardhat/config";

import { getParamByKey, readDeployedAddress, requireBaseChain, requireChainID } from "../helpers";

const grantingScope = scope("grant-backend", "Grant the backend role to a specified account");

grantingScope
    .task("MagnifyCashSBT", "Grant the backend role to a specified account")
    .addParam("account", "An account which is granted the backend role")
    .setAction(async (taskArgs, hre) => {
        const { ethers, network, run } = hre;
        await run("compile");

        const [defaultAdmin] = await ethers.getSigners();

        requireBaseChain(network);

        const chainID = requireChainID(network);
        const contractAddress = await readDeployedAddress(chainID, "MagnifyCashSBT#MagnifyCashSBT");
        const contract = await ethers.getContractAt("MagnifyCashSBT", contractAddress);

        const backendAddress = getParamByKey(taskArgs as object, "account");
        await contract.connect(defaultAdmin).grantRole(await contract.BACKEND_ROLE(), backendAddress);
    });

grantingScope
    .task("MagnifyCashCollateralNFT", "Grant the backend role to a specified account")
    .addParam("account", "An account which is granted the backend role")
    .setAction(async (taskArgs, hre) => {
        const { ethers, network, run } = hre;
        await run("compile");

        const [defaultAdmin] = await ethers.getSigners();

        requireBaseChain(network);

        const chainID = requireChainID(network);
        const contractAddress = await readDeployedAddress(chainID, "MagnifyCashCollateralNFT#MagnifyCashCollateralNFT");
        const contract = await ethers.getContractAt("MagnifyCashCollateralNFT", contractAddress);

        const backendAddress = getParamByKey(taskArgs as object, "account");
        await contract.connect(defaultAdmin).grantRole(await contract.BACKEND_ROLE(), backendAddress);
    });

import hre, { ignition } from "hardhat";

import Module from "../ignition/modules/MagnifyCashCollateralNFT";

describe("Deployment", () => {
    if (hre.network.name !== "hardhat" && hre.network.name !== "base-local" && hre.network.name !== "localhost")
        throw new Error("Error. This script is assumed to run on a forked network or locally");

    it("Deploys all the contracts [skip-on-coverage]", async () => {
        await ignition.deploy(Module);
    });
});

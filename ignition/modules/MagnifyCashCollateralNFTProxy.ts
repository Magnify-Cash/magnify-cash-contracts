import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import MagnifyCashSBT from "./MagnifyCashSBT";

export default buildModule("MagnifyCashCollateralNFTProxy", (m) => {
    const { magnifyCashSBT } = m.useModule(MagnifyCashSBT);

    const deployer = m.getAccount(0);
    const proxyAdminOwner = deployer;

    const magnifyCashCollateralNFT = m.contract("MagnifyCashCollateralNFT");

    const defaultAdmin = proxyAdminOwner;
    const encodedFunctionCall = m.encodeFunctionCall(magnifyCashCollateralNFT, "initialize", [
        defaultAdmin,
        magnifyCashSBT
    ]);
    const proxy = m.contract("TransparentUpgradeableProxy", [
        magnifyCashCollateralNFT,
        proxyAdminOwner,
        encodedFunctionCall
    ]);

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");

    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

    return { proxyAdmin, proxy, magnifyCashSBT };
});

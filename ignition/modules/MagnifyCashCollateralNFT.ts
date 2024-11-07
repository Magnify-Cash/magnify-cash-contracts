import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import MagnifyCashSBT from "./MagnifyCashSBT";

const ProxyModule = buildModule("MagnifyCashCollateralNFTProxy", (m) => {
    const { sbt } = m.useModule(MagnifyCashSBT);

    const deployer = m.getAccount(0);
    const proxyAdminOwner = deployer;

    const collateralNFT = m.contract("MagnifyCashCollateralNFT");

    const defaultAdmin = proxyAdminOwner;
    const encodedFunctionCall = m.encodeFunctionCall(collateralNFT, "initialize", [defaultAdmin, sbt]);
    const proxy = m.contract("TransparentUpgradeableProxy", [collateralNFT, proxyAdminOwner, encodedFunctionCall]);

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");

    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

    return { proxyAdmin, proxy, sbt };
});

const CollateralNFTModule = buildModule("MagnifyCashCollateralNFT", (m) => {
    const { proxy, proxyAdmin, sbt } = m.useModule(ProxyModule);

    const collateralNFT = m.contractAt("MagnifyCashCollateralNFT", proxy);

    return { collateralNFT, proxy, proxyAdmin, sbt };
});

export default CollateralNFTModule;

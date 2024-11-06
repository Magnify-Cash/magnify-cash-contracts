import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MagnifyCashSBTProxy", (m) => {
    const deployer = m.getAccount(0);
    const proxyAdminOwner = deployer;

    const magnifyCashSBT = m.contract("MagnifyCashSBT");

    const defaultAdmin = proxyAdminOwner;
    const encodedFunctionCall = m.encodeFunctionCall(magnifyCashSBT, "initialize", [defaultAdmin]);
    const proxy = m.contract("TransparentUpgradeableProxy", [magnifyCashSBT, proxyAdminOwner, encodedFunctionCall]);

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");

    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

    return { proxyAdmin, proxy };
});

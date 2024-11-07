import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProxyModule = buildModule("MagnifyCashSBTProxy", (m) => {
    const deployer = m.getAccount(0);
    const proxyAdminOwner = deployer;

    const sbt = m.contract("MagnifyCashSBT");

    const defaultAdmin = proxyAdminOwner;
    const encodedFunctionCall = m.encodeFunctionCall(sbt, "initialize", [defaultAdmin]);
    const proxy = m.contract("TransparentUpgradeableProxy", [sbt, proxyAdminOwner, encodedFunctionCall]);

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");

    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

    return { proxyAdmin, proxy };
});

const SBTModule = buildModule("MagnifyCashSBT", (m) => {
    const { proxy, proxyAdmin } = m.useModule(ProxyModule);

    const sbt = m.contractAt("MagnifyCashSBT", proxy);

    return { sbt, proxy, proxyAdmin };
});

export default SBTModule;

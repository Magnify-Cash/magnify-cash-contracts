import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import MagnifyCashSBTProxy from "./MagnifyCashSBTProxy";

export default buildModule("MagnifyCashSBT", (m) => {
    const { proxy, proxyAdmin } = m.useModule(MagnifyCashSBTProxy);

    const magnifyCashSBT = m.contractAt("MagnifyCashSBT", proxy);

    return { magnifyCashSBT, proxy, proxyAdmin };
});

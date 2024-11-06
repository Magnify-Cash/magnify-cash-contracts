import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import MagnifyCashCollateralNFTProxy from "./MagnifyCashCollateralNFTProxy";

export default buildModule("MagnifyCashCollateralNFT", (m) => {
    const { proxy, proxyAdmin, magnifyCashSBT } = m.useModule(MagnifyCashCollateralNFTProxy);

    const magnifyCashCollateralNFT = m.contractAt("MagnifyCashCollateralNFT", proxy);

    return { magnifyCashCollateralNFT, proxy, proxyAdmin, magnifyCashSBT };
});

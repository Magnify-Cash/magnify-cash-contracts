import { expect } from "chai";
import { ethers, ignition } from "hardhat";
const { ZeroAddress } = ethers;
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import SBTModule from "../ignition/modules/MagnifyCashSBT";
import CollateralNFTModule from "../ignition/modules/MagnifyCashCollateralNFT";
import { verificationResults } from "../scripts/helpers";

import type { MagnifyCashCollateralNFT, MagnifyCashSBT } from "../typechain-types";

const data = Array.from(verificationResults).map((v) => JSON.stringify(v));

const [name, symbol] = ["MAGBot ID", "MBID"];
const version = "1.0.0";

describe("MagnifyCashCollateralNFT", () => {
    const fixture = async () => {
        const [deployer, backend, pauser, account, sbtlessAccount] = await ethers.getSigners();

        const { collateralNFT: collateralNFTContract, sbt: sbtContract } = await ignition.deploy(CollateralNFTModule);
        const collateral = collateralNFTContract as unknown as MagnifyCashCollateralNFT;
        const sbt = sbtContract as unknown as MagnifyCashSBT;

        const defaultAdmin = deployer;
        await sbt.connect(defaultAdmin).grantRole(await collateral.BACKEND_ROLE(), backend);

        await collateral.connect(defaultAdmin).grantRole(await collateral.PAUSER_ROLE(), pauser);
        await collateral.connect(defaultAdmin).grantRole(await collateral.BACKEND_ROLE(), backend);

        const accountSBTID = await sbt.nextTokenID();
        await sbt.connect(backend).mint(account, data[0]);

        return { collateral, sbt, defaultAdmin, backend, pauser, account, accountSBTID, sbtlessAccount };
    };
    const restore = async () => await loadFixture(fixture);

    describe("# Initialization", () => {
        it("disables initializers", async () => {
            const [deployer] = await ethers.getSigners();
            const sbtAddr = deployer.address;
            const impl = await ethers.deployContract("MagnifyCashCollateralNFT", []);
            await expect(impl.initialize(deployer, sbtAddr)).to.be.revertedWithCustomError(
                impl,
                "InvalidInitialization"
            );
        });

        context("when initialization", () => {
            let collateral: MagnifyCashCollateralNFT, sbtAddr: string, defaultAdminAddr: string;

            beforeEach(async () => {
                const { sbt: sbtContract } = await ignition.deploy(SBTModule);
                sbtAddr = await sbtContract.getAddress();

                const [deployer] = await ethers.getSigners();
                defaultAdminAddr = deployer.address;

                const impl = await ethers.deployContract("MagnifyCashCollateralNFT", []);
                const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [impl, deployer, "0x"]);
                collateral = await ethers.getContractAt("MagnifyCashCollateralNFT", proxy);
            });

            const eventName = "SBTSet";
            it(`emits the \`${eventName}\` event`, async () => {
                const tx = await collateral.initialize(defaultAdminAddr, sbtAddr);
                await expect(tx).to.emit(collateral, eventName).withArgs(sbtAddr);
            });

            it("reverts if the default admin is the zero address", async () => {
                await expect(collateral.initialize(ZeroAddress, sbtAddr)).to.be.revertedWithCustomError(
                    collateral,
                    "ZeroAddress"
                );
            });

            it("reverts if the SBT contract is the zero address", async () => {
                await expect(collateral.initialize(defaultAdminAddr, ZeroAddress)).to.be.revertedWithCustomError(
                    collateral,
                    "ZeroAddress"
                );
            });
        });

        context("after initialization", () => {
            it(`has the name \`${name}\``, async function () {
                const { collateral } = await restore();
                expect(await collateral.name()).to.be.eq(name);
            });

            it(`has the symbol \`${symbol}\``, async function () {
                const { collateral } = await restore();
                expect(await collateral.symbol()).to.be.eq(symbol);
            });

            it(`has the version \`${version}\``, async function () {
                const { collateral } = await restore();
                expect(await collateral.version()).to.be.eq(version);
            });

            it("confirms that the specified account has the default admin role", async () => {
                const { collateral, defaultAdmin } = await restore();
                expect(await collateral.hasRole(await collateral.DEFAULT_ADMIN_ROLE(), defaultAdmin)).to.be.true;
            });

            it("returns the address of the SBT contract", async function () {
                const { collateral, sbt } = await restore();
                expect(await collateral.sbt()).to.be.eq(sbt);
            });

            const firstCollateralID = "1"; // `0` is used to mean an ID does not exist.
            it(`returns \`${firstCollateralID}\` for the next collateral ID`, async function () {
                const { collateral } = await restore();
                expect(await collateral.nextCollateralID()).to.be.eq(firstCollateralID);
            });

            it("reverts when re-initialization", async () => {
                const { collateral, defaultAdmin, sbt } = await restore();
                await expect(collateral.initialize(defaultAdmin, sbt)).to.be.revertedWithCustomError(
                    collateral,
                    "InvalidInitialization"
                );
            });
        });
    });

    describe("# Minting", () => {
        it("mints", async () => {
            const { collateral, backend, account, accountSBTID } = await restore();

            const collateralID = await collateral.nextCollateralID();

            await collateral.connect(backend).mint(account);

            expect(await collateral.nextCollateralID()).to.be.eq(collateralID + 1n);
            expect(await collateral.ownerOf(collateralID)).to.be.eq(account);
            expect(await collateral.collateralBySBT(accountSBTID)).to.be.eq(collateralID);
            expect(await collateral.sbtByCollateral(collateralID)).to.be.eq(accountSBTID);
        });

        it("returns a collateral ID when minting", async () => {
            const { collateral, backend, account } = await restore();

            expect(await collateral.connect(backend).mint.staticCall(account)).to.be.eq(
                await collateral.nextCollateralID()
            );
        });

        it("reverts when an account has not an SBT", async () => {
            const { collateral, backend, sbtlessAccount } = await restore();

            await expect(collateral.connect(backend).mint(sbtlessAccount))
                .to.be.revertedWithCustomError(collateral, "AccountHasNotSBT")
                .withArgs(sbtlessAccount);
        });

        it("reverts when an account has a collateral", async () => {
            const { collateral, backend, account, accountSBTID } = await restore();

            await collateral.connect(backend).mint(account);

            await expect(collateral.connect(backend).mint(account))
                .to.be.revertedWithCustomError(collateral, "AccountHasCollateral")
                .withArgs(account, await collateral.collateralBySBT(accountSBTID));
        });

        it("prevents non-backends from minting", async () => {
            const { collateral, account } = await restore();

            await expect(collateral.connect(account).mint(account))
                .to.be.revertedWithCustomError(collateral, "AccessControlUnauthorizedAccount")
                .withArgs(account, await collateral.BACKEND_ROLE());
        });
    });

    describe("# Setting the base URI", () => {
        it("sets", async () => {
            const { collateral, defaultAdmin } = await restore();

            const uri = "https://example.com/";
            const tx = await collateral.connect(defaultAdmin).setBaseURI(uri);
            await expect(tx).to.emit(collateral, "BaseURISet").withArgs(uri);

            expect(await collateral.baseURI()).to.be.eq(uri);
        });

        it("reverts when an empty URI", async () => {
            const { collateral, defaultAdmin } = await restore();
            await expect(collateral.connect(defaultAdmin).setBaseURI("")).to.be.revertedWithCustomError(
                collateral,
                "EmptyURI"
            );
        });

        it("prevents non-admins from setting", async () => {
            const { collateral, account } = await restore();
            await expect(collateral.connect(account).setBaseURI("https://example.com/"))
                .to.be.revertedWithCustomError(collateral, "AccessControlUnauthorizedAccount")
                .withArgs(account, await collateral.DEFAULT_ADMIN_ROLE());
        });
    });

    describe("# Setting the address of the SBT contract", () => {
        it("sets", async () => {
            const { collateral, defaultAdmin, sbt } = await restore();

            const tx = await collateral.connect(defaultAdmin).setSBT(sbt);
            await expect(tx).to.emit(collateral, "SBTSet").withArgs(sbt);

            expect(await collateral.sbt()).to.be.eq(sbt);
        });

        it("reverts when the passed SBT address is the zero address", async () => {
            const { collateral, defaultAdmin } = await restore();
            await expect(collateral.connect(defaultAdmin).setSBT(ZeroAddress)).to.be.revertedWithCustomError(
                collateral,
                "ZeroAddress"
            );
        });

        it("prevents non-admins from setting", async () => {
            const { collateral, account, sbt } = await restore();
            await expect(collateral.connect(account).setSBT(sbt))
                .to.be.revertedWithCustomError(collateral, "AccessControlUnauthorizedAccount")
                .withArgs(account, await collateral.DEFAULT_ADMIN_ROLE());
        });
    });

    describe("# Pause", function () {
        it("Pauses all token transfers", async function () {
            const { collateral, pauser } = await restore();
            await collateral.connect(pauser).pause();
            expect(await collateral.paused()).to.be.true;
        });

        it("Prevents non-pausers from pausing", async function () {
            const { collateral, account } = await restore();
            await expect(collateral.connect(account).pause())
                .to.be.revertedWithCustomError(collateral, "AccessControlUnauthorizedAccount")
                .withArgs(account, await collateral.PAUSER_ROLE());
        });

        it("Unpauses all token transfers", async function () {
            const { collateral, pauser } = await restore();
            await collateral.connect(pauser).pause();
            await collateral.connect(pauser).unpause();
            expect(await collateral.paused()).to.be.false;
        });

        it("Prevents non-pausers from unpausing", async function () {
            const { collateral, pauser, account } = await restore();
            await collateral.connect(pauser).pause();

            await expect(collateral.connect(account).unpause())
                .to.be.revertedWithCustomError(collateral, "AccessControlUnauthorizedAccount")
                .withArgs(account, await collateral.PAUSER_ROLE());
        });
    });

    describe("# Getting", () => {
        it("returns the base URI", async () => {
            const { collateral } = await restore();
            expect(await collateral.baseURI()).to.be.eq("");
        });

        it("returns a token URI based on the base URI", async () => {
            const { collateral, defaultAdmin, backend, account } = await restore();

            const uri = "https://example.com/";
            await collateral.connect(defaultAdmin).setBaseURI(uri);
            const collateralID = await collateral.nextCollateralID();
            await collateral.connect(backend).mint(account);

            expect(await collateral.tokenURI(collateralID)).to.be.eq(uri + collateralID);
        });

        it("returns a collateral ID by an SBT ID", async () => {
            const { collateral, backend, account, accountSBTID } = await restore();
            const collateralID = await collateral.nextCollateralID();
            await collateral.connect(backend).mint(account);
            expect(await collateral.collateralBySBT(accountSBTID)).to.be.eq(collateralID);
        });

        it("returns an SBT ID by a collateral ID", async () => {
            const { collateral, backend, account, accountSBTID } = await restore();
            const collateralID = await collateral.nextCollateralID();
            await collateral.connect(backend).mint(account);
            expect(await collateral.sbtByCollateral(collateralID)).to.be.eq(accountSBTID);
        });
    });

    describe("# Supporting interfaces", () => {
        it("supports the interface of the ERC165 standard", async () => {
            const { collateral } = await restore();
            expect(
                await collateral.supportsInterface(
                    ethers.toBeHex(ethers.toBigInt(collateral.supportsInterface.fragment.selector), 4)
                )
            ).to.be.true;
        });
    });
});

import { expect } from "chai";
import { ethers, ignition } from "hardhat";
const { ZeroAddress } = ethers;
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import SBTModule from "../ignition/modules/MagnifyCashSBT";
import { verificationResults } from "../scripts/helpers";

import type { MagnifyCashSBT } from "../typechain-types";

const data = Array.from(verificationResults).map((v) => JSON.stringify(v));

const [name, symbol] = ["MAGBot SBT", "MBSBT"];
const version = "1.0.0";

describe("MagnifyCashSBT", () => {
    const fixture = async () => {
        const [deployer, backend, account, account2] = await ethers.getSigners();

        const { sbt: sbtContract } = await ignition.deploy(SBTModule);
        const sbt = sbtContract as unknown as MagnifyCashSBT;

        const defaultAdmin = deployer;
        await sbt.connect(defaultAdmin).grantRole(await sbt.BACKEND_ROLE(), backend);

        return { sbt, defaultAdmin, backend, account, account2 };
    };
    const restore = async () => await loadFixture(fixture);

    describe("# Initialization", () => {
        it("reverts when the default admin is the zero address", async () => {
            const [deployer] = await ethers.getSigners();

            const implementation = await ethers.deployContract("MagnifyCashSBT", []);
            const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [implementation, deployer, "0x"]);
            const sbt = await ethers.getContractAt("MagnifyCashSBT", proxy);

            await expect(sbt.initialize(ZeroAddress)).to.be.revertedWithCustomError(sbt, "ZeroAddress");
        });

        it("disables initializers", async () => {
            const [deployer] = await ethers.getSigners();
            const impl = await ethers.deployContract("MagnifyCashSBT", []);
            await expect(impl.initialize(deployer)).to.be.revertedWithCustomError(impl, "InvalidInitialization");
        });

        context("after initialization", () => {
            it(`has the name \`${name}\``, async function () {
                const { sbt } = await restore();
                expect(await sbt.name()).to.be.eq(name);
            });

            it(`has the symbol \`${symbol}\``, async function () {
                const { sbt } = await restore();
                expect(await sbt.symbol()).to.be.eq(symbol);
            });

            it(`has the version \`${version}\``, async function () {
                const { sbt } = await restore();
                expect(await sbt.version()).to.be.eq(version);
            });

            it("confirms that the specified account has the default admin role", async () => {
                const { sbt, defaultAdmin } = await restore();
                expect(await sbt.hasRole(await sbt.DEFAULT_ADMIN_ROLE(), defaultAdmin)).to.be.true;
            });

            const firstSBTID = "1"; // `0` is used to mean an ID does not exist.
            it(`returns \`${firstSBTID}\` for the next SBT ID`, async function () {
                const { sbt } = await restore();
                expect(await sbt.nextTokenID()).to.be.eq(firstSBTID);
            });

            it("reverts when re-initialization", async () => {
                const { sbt, defaultAdmin } = await restore();
                await expect(sbt.initialize(defaultAdmin)).to.be.revertedWithCustomError(sbt, "InvalidInitialization");
            });
        });
    });

    describe("# Transfer", () => {
        it("reverts when transferring an SBT from an account", async () => {
            const { sbt, backend, account, account2 } = await restore();
            const tokenID = await sbt.nextTokenID();
            await sbt.connect(backend).mint(account, data[0]);
            await expect(sbt.connect(account).transferFrom(account, account2, tokenID)).to.be.revertedWithCustomError(
                sbt,
                "NonTransferable"
            );
        });
    });

    describe("# Minting", () => {
        it("mints", async () => {
            const { sbt, backend, account } = await restore();

            const tokenID = await sbt.nextTokenID();

            await sbt.connect(backend).mint(account, data[0]);

            expect(await sbt.nextTokenID()).to.be.eq(tokenID + 1n);
            expect(await sbt.ownerOf(tokenID)).to.be.eq(account);
            expect(await sbt.tokenByAccount(account)).to.be.eq(tokenID);
            expect(await sbt.verificationByToken(tokenID)).to.be.eq(data[0]);
            expect(await sbt.tokenByVerification(data[0])).to.be.eq(tokenID);
        });

        it("returns an SBT ID when minting", async () => {
            const { sbt, backend, account } = await restore();
            expect(await sbt.connect(backend).mint.staticCall(account, data[0])).to.be.eq(await sbt.nextTokenID());
        });

        it("reverts when empty verification data", async () => {
            const { sbt, backend, account } = await restore();
            await expect(sbt.connect(backend).mint(account, "")).to.be.revertedWithCustomError(sbt, "EmptyData");
        });

        it("reverts when an account has an SBT", async () => {
            const { sbt, backend, account } = await restore();

            await sbt.connect(backend).mint(account, data[0]);

            await expect(sbt.connect(backend).mint(account, data[1]))
                .to.be.revertedWithCustomError(sbt, "AlreadyVerified")
                .withArgs(account, await sbt.tokenByAccount(account));
        });

        it("reverts when an SBT with the verification data exists", async () => {
            const { sbt, backend, account, account2 } = await restore();

            await sbt.connect(backend).mint(account, data[0]);

            await expect(sbt.connect(backend).mint(account2, data[0]))
                .to.be.revertedWithCustomError(sbt, "DataAlreadySetFor")
                .withArgs(await sbt.tokenByVerification(data[0]));
        });

        it("prevents non-backends from minting", async () => {
            const { sbt, account } = await restore();

            await expect(sbt.connect(account).mint(account, data[0]))
                .to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount")
                .withArgs(account, await sbt.BACKEND_ROLE());
        });
    });

    describe("# Setting the base URI", () => {
        it("sets", async () => {
            const { sbt, defaultAdmin } = await restore();

            const uri = "https://example.com/";
            const tx = await sbt.connect(defaultAdmin).setBaseURI(uri);
            await expect(tx).to.emit(sbt, "BaseURISet").withArgs(uri);

            expect(await sbt.baseURI()).to.be.eq(uri);
        });

        it("reverts when an empty URI", async () => {
            const { sbt, defaultAdmin } = await restore();
            await expect(sbt.connect(defaultAdmin).setBaseURI("")).to.be.revertedWithCustomError(sbt, "EmptyURI");
        });

        it("prevents non-admins from setting", async () => {
            const { sbt, account } = await restore();
            await expect(sbt.connect(account).setBaseURI("https://example.com/"))
                .to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount")
                .withArgs(account, await sbt.DEFAULT_ADMIN_ROLE());
        });
    });

    describe("# Getting", () => {
        it("returns the base URI", async () => {
            const { sbt } = await restore();
            expect(await sbt.baseURI()).to.be.eq("");
        });

        it("returns a token URI based on the base URI", async () => {
            const { sbt, defaultAdmin, backend, account } = await restore();

            const uri = "https://example.com/";
            await sbt.connect(defaultAdmin).setBaseURI(uri);
            const tokenID = await sbt.nextTokenID();
            await sbt.connect(backend).mint(account, data[0]);

            expect(await sbt.tokenURI(tokenID)).to.be.eq(uri + tokenID);
        });

        it("reverts when returning verification data by an account if an unknown account", async () => {
            const { sbt, account } = await restore();
            await expect(sbt.verificationByAccount(account))
                .to.be.revertedWithCustomError(sbt, "UnknownAccount")
                .withArgs(account);
        });

        it("reverts when returning an account by verification data if an unknown verification", async () => {
            const { sbt } = await restore();
            await expect(sbt.accountByVerification(data[0])).to.be.revertedWithCustomError(sbt, "UnknownVerification");
        });

        it("returns a verification status for an account", async () => {
            const { sbt, backend, account } = await restore();
            expect(await sbt.verified(account)).to.be.false;
            await sbt.connect(backend).mint(account, data[0]);
            expect(await sbt.verified(account)).to.be.true;
        });

        context("after minting an SBT for an account", () => {
            let sbt: MagnifyCashSBT, tokenID: bigint, accountAddr: string;

            beforeEach(async () => {
                const { sbt: magnifyCashSBT, backend, account } = await restore();
                sbt = magnifyCashSBT;
                tokenID = await magnifyCashSBT.nextTokenID();
                accountAddr = account.address;

                await magnifyCashSBT.connect(backend).mint(account, data[0]);
            });

            it("returns an SBT ID by an account", async () => {
                expect(await sbt.tokenByAccount(accountAddr)).to.be.eq(tokenID);
            });

            it("returns verification data by an SBT ID", async () => {
                expect(await sbt.verificationByToken(tokenID)).to.be.eq(data[0]);
            });

            it("returns an SBT ID by verification data", async () => {
                expect(await sbt.tokenByVerification(data[0])).to.be.eq(tokenID);
            });

            it("returns an SBT ID by an account", async () => {
                expect(await sbt.tokenByAccount(accountAddr)).to.be.eq(tokenID);
            });

            it("returns verification data by an account", async () => {
                expect(await sbt.verificationByAccount(accountAddr)).to.be.eq(data[0]);
            });

            it("returns an account by verification data", async () => {
                expect(await sbt.accountByVerification(data[0])).to.be.eq(accountAddr);
            });
        });
    });

    describe("# Supporting interfaces", () => {
        it("supports the interface of the ERC165 standard", async () => {
            const { sbt } = await restore();
            expect(
                await sbt.supportsInterface(ethers.toBeHex(ethers.toBigInt(sbt.supportsInterface.fragment.selector), 4))
            ).to.be.true;
        });
    });
});

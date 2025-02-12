import * as core from "@shapeshiftoss/hdwallet-core";
import * as ledger from "@shapeshiftoss/hdwallet-ledger";
import * as trezor from "@shapeshiftoss/hdwallet-trezor";
import * as portis from "@shapeshiftoss/hdwallet-portis";

const MNEMONIC12_NOPIN_NOPASSPHRASE = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle";

const TIMEOUT = 60 * 1000;

/**
 *  Main integration suite for testing ETHWallet implementations' Ethereum support.
 */
export function ethereumTests(get: () => { wallet: core.HDWallet; info: core.HDWalletInfo }): void {
  let wallet: core.ETHWallet & core.HDWallet;

  describe("Ethereum", () => {
    beforeAll(async () => {
      const { wallet: w } = get();
      if (core.supportsETH(w)) wallet = w;
    });

    beforeEach(async () => {
      if (!wallet) return;
      await wallet.wipe();
      await wallet.loadDevice({
        mnemonic: MNEMONIC12_NOPIN_NOPASSPHRASE,
        label: "test",
        skipChecksum: true,
      });
    }, TIMEOUT);

    test(
      "ethSupportsNetwork()",
      async () => {
        if (!wallet) return;
        expect(typeof (await wallet.ethSupportsNetwork(1)) === typeof true).toBeTruthy();
      },
      TIMEOUT
    );

    test(
      "ethSupportsNativeShapeShift()",
      async () => {
        if (!wallet) return;
        // TODO: add a test that pays a ShapeShift conduit
        expect(typeof wallet.ethSupportsNativeShapeShift() === typeof true).toBeTruthy();
      },
      TIMEOUT
    );

    test(
      "ethSupportsSecureTransfer()",
      async () => {
        if (!wallet) return;
        if (await wallet.ethSupportsSecureTransfer()) {
          let account0 = core.bip32ToAddressNList("m/44'/60'/0'/0/0");
          let account1 = core.bip32ToAddressNList("m/44'/60'/1'/0/0");
          let account1Addr = await wallet.ethGetAddress({
            addressNList: account1,
            showDisplay: false,
          });
          let res = await wallet.ethSignTx({
            addressNList: account0,
            nonce: "0x01",
            gasPrice: "0x14",
            gasLimit: "0x14",
            value: "0x00",
            to: core.mustBeDefined(account1Addr),
            toAddressNList: account1,
            chainId: 1,
            data: "",
          });
          expect(res).toEqual({
            r: "0x2482a45ee0d2851d3ab76a693edd7a393e8bc99422f7857be78a883bc1d60a5b",
            s: "0x18d776bcfae586bf08ecc70f714c9bec8959695a20ef73ad0c28233fdaeb1bd2",
            v: 37,
            serialized:
              "0xf85d011414946a32030447a4c751e651db903c3513f7e1380c98808025a02482a45ee0d2851d3ab76a693edd7a393e8bc99422f7857be78a883bc1d60a5ba018d776bcfae586bf08ecc70f714c9bec8959695a20ef73ad0c28233fdaeb1bd2",
          });
        }
      },
      TIMEOUT
    );

    test(
      "ethGetAccountPaths()",
      () => {
        if (!wallet) return;
        let paths = wallet.ethGetAccountPaths({
          coin: "Ethereum",
          accountIdx: 0,
        });
        expect(paths.length > 0).toBe(true);
        expect(paths[0].hardenedPath[0] > 0x80000000).toBe(true);
        paths.forEach((path) => {
          const nextPath = wallet.ethNextAccountPath(path);
          expect(nextPath === undefined || nextPath.addressNList.join() !== path.addressNList.join()).toBeTruthy();
        });
      },
      TIMEOUT
    );

    test(
      "ethGetAddress()",
      async () => {
        if (!wallet) return;
        expect(
          await wallet.ethGetAddress({
            addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
            showDisplay: false,
          })
        ).toEqual("0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8");
      },
      TIMEOUT
    );

    test(
      "ethSignTx() - ETH",
      async () => {
        if (!wallet) return;
        let res = await wallet.ethSignTx({
          addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
          nonce: "0x01",
          gasPrice: "0x1dcd65000",
          gasLimit: "0x5622",
          value: "0x2c68af0bb14000",
          to: "0x12eC06288EDD7Ae2CC41A843fE089237fC7354F0",
          chainId: 1,
          data: "",
        });
        expect(res).toEqual({
          r: "0x63db3dd3bf3e1fe7dde1969c0fc8850e34116d0b501c0483a0e08c0f77b8ce0a",
          s: "0x28297d012cccf389f6332415e96ee3fc0bbf8474d05f646e029cd281a031464b",
          v: 38,
          serialized:
            "0xf86b018501dcd650008256229412ec06288edd7ae2cc41a843fe089237fc7354f0872c68af0bb140008026a063db3dd3bf3e1fe7dde1969c0fc8850e34116d0b501c0483a0e08c0f77b8ce0aa028297d012cccf389f6332415e96ee3fc0bbf8474d05f646e029cd281a031464b",
        });
      },
      TIMEOUT
    );

    test(
      "ethSignTx() - ETH EIP-1559",
      async () => {
        if (!wallet) {
          return;
        }
        if (!wallet.ethSupportsEIP1559()) {
          return;
        }
        let res = await wallet.ethSignTx({
          addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
          nonce: "0x01",
          gasPrice: "0x1dcd65000",
          gasLimit: "0x5622",
          maxFeePerGas: "0x400",
          maxPriorityFeePerGas: "0x400",
          value: "0x2c68af0bb14000",
          to: "0x12eC06288EDD7Ae2CC41A843fE089237fC7354F0",
          chainId: 1,
          data: "",
        });
        expect(res).toEqual({
          r: "0x429c6ce090e272049a94b13466b3d27a4d79e31dcf50dbc614db7e239f3103c7",
          s: "0x2ffc46592f561f7fdbac10cd3521dca47d1afa00ebc03af7ea0d05081e503cb7",
          v: 1,
          serialized:
            "0x02f86d01018204008204008256229412ec06288edd7ae2cc41a843fe089237fc7354f0872c68af0bb1400080c001a0429c6ce090e272049a94b13466b3d27a4d79e31dcf50dbc614db7e239f3103c7a02ffc46592f561f7fdbac10cd3521dca47d1afa00ebc03af7ea0d05081e503cb7",
        });
      },
      TIMEOUT
    );

    test(
      "ethSignTx() - ETH EIP-1559 (optional)",
      async () => {
        if (!wallet) return;
        let res = await wallet.ethSignTx({
          addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
          nonce: "0x01",
          gasPrice: "0x1dcd65000",
          gasLimit: "0x5622",
          maxFeePerGas: "",
          maxPriorityFeePerGas: "",
          value: "0x2c68af0bb14000",
          to: "0x12eC06288EDD7Ae2CC41A843fE089237fC7354F0",
          chainId: 1,
          data: "",
        });
        expect(res).toEqual({
          r: "0x63db3dd3bf3e1fe7dde1969c0fc8850e34116d0b501c0483a0e08c0f77b8ce0a",
          s: "0x28297d012cccf389f6332415e96ee3fc0bbf8474d05f646e029cd281a031464b",
          v: 38,
          serialized:
            "0xf86b018501dcd650008256229412ec06288edd7ae2cc41a843fe089237fc7354f0872c68af0bb140008026a063db3dd3bf3e1fe7dde1969c0fc8850e34116d0b501c0483a0e08c0f77b8ce0aa028297d012cccf389f6332415e96ee3fc0bbf8474d05f646e029cd281a031464b",
        });
      },
      TIMEOUT
    );

    test(
      "ethSignTx() - ERC20",
      async () => {
        if (!wallet) return;
        let res = await wallet.ethSignTx({
          addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
          nonce: "0x01",
          gasPrice: "0x14",
          gasLimit: "0x14",
          value: "0x00",
          to: "0x41e5560054824ea6b0732e656e3ad64e20e94e45",
          chainId: 1,
          data:
            "0x" +
            "a9059cbb000000000000000000000000" +
            "1d8ce9022f6284c3a5c317f8f34620107214e545" +
            "00000000000000000000000000000000000000000000000000000002540be400",
        });
        expect(res).toEqual({
          r: "0x1238fd332545415f09a01470350a5a20abc784dbf875cf58f7460560e66c597f",
          s: "0x10efa4dd6fdb381c317db8f815252c2ac0d2a883bd364901dee3dec5b7d3660a",
          v: 37,
          serialized:
            "0xf8a20114149441e5560054824ea6b0732e656e3ad64e20e94e4580b844a9059cbb0000000000000000000000001d8ce9022f6284c3a5c317f8f34620107214e54500000000000000000000000000000000000000000000000000000002540be40025a01238fd332545415f09a01470350a5a20abc784dbf875cf58f7460560e66c597fa010efa4dd6fdb381c317db8f815252c2ac0d2a883bd364901dee3dec5b7d3660a",
        });
      },
      TIMEOUT
    );

    test(
      "ethSignTx() - long contract data",
      async () => {
        if (!wallet) return;
        if (ledger.isLedger(wallet)) return; // FIXME: just test kk for now
        if (trezor.isTrezor(wallet)) return; // FIXME: just test kk for now
        if (portis.isPortis(wallet)) return; // FIXME: just test kk for now
        let res = await wallet.ethSignTx({
          addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
          nonce: "0xab",
          gasPrice: "0x55ae82600",
          gasLimit: "0x5140e",
          value: "0x00",
          to: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
          chainId: 1,
          data:
            "0x" +
            "415565b0" +
            "000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7" +
            "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" +
            "0000000000000000000000000000000000000000000000000000000c5c360b9c" +
            "0000000000000000000000000000000000000000000000000000000c58cb06ec" +
            "00000000000000000000000000000000000000000000000000000000000000a0" +
            "0000000000000000000000000000000000000000000000000000000000000002" +
            "0000000000000000000000000000000000000000000000000000000000000040" +
            "0000000000000000000000000000000000000000000000000000000000000360" +
            "0000000000000000000000000000000000000000000000000000000000000013" +
            "0000000000000000000000000000000000000000000000000000000000000040" +
            "00000000000000000000000000000000000000000000000000000000000002c0" +
            "0000000000000000000000000000000000000000000000000000000000000020" +
            "0000000000000000000000000000000000000000000000000000000000000000" +
            "000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7" +
            "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" +
            "0000000000000000000000000000000000000000000000000000000000000120" +
            "0000000000000000000000000000000000000000000000000000000000000280" +
            "0000000000000000000000000000000000000000000000000000000000000280" +
            "0000000000000000000000000000000000000000000000000000000000000260" +
            "0000000000000000000000000000000000000000000000000000000c5c360b9c" +
            "0000000000000000000000000000000000000000000000000000000000000000" +
            "0000000000000000000000000000000000000000000000000000000000000001" +
            "0000000000000000000000000000000000000000000000000000000000000020" +
            "0000000000000000000000000000000a446f646f000000000000000000000000" +
            "0000000000000000000000000000000000000000000000000000000c5c360b9c" +
            "0000000000000000000000000000000000000000000000000000000c58cb06ec" +
            "0000000000000000000000000000000000000000000000000000000000000080" +
            "0000000000000000000000000000000000000000000000000000000000000060" +
            "000000000000000000000000533da777aedce766ceae696bf90f8541a4ba80eb" +
            "000000000000000000000000c9f93163c99695c6526b799ebca2207fdf7d61ad" +
            "0000000000000000000000000000000000000000000000000000000000000001" +
            "0000000000000000000000000000000000000000000000000000000000000001" +
            "0000000000000000000000000000000000000000000000000000000000000000" +
            "0000000000000000000000000000000000000000000000000000000000000007" +
            "0000000000000000000000000000000000000000000000000000000000000040" +
            "0000000000000000000000000000000000000000000000000000000000000100" +
            "0000000000000000000000000000000000000000000000000000000000000020" +
            "0000000000000000000000000000000000000000000000000000000000000040" +
            "00000000000000000000000000000000000000000000000000000000000000c0" +
            "0000000000000000000000000000000000000000000000000000000000000003" +
            "000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7" +
            "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" +
            "000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" +
            "0000000000000000000000000000000000000000000000000000000000000000" +
            "869584cd000000000000000000000000c770eefad204b5180df6a14ee197d99d" +
            "808ee52d0000000000000000000000000000000000000000000000da413736cc" +
            "60c8dd4e",
        });
        expect(res).toEqual({
          r: "0x5ea245ddd00fdf3958d6223255e37dcb0c61fa62cfa9cfb25e507da16ec8d96a",
          s: "0x6c428730776958b80fd2b2201600420bb49059f9b34ee3b960cdcce45d4a1e09",
          v: 37,
          serialized:
            "0xf9063081ab85055ae826008305140e94def1c0ded9bec7f1a1670819833240f027b25eff80b905c8415565b0000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000c5c360b9c0000000000000000000000000000000000000000000000000000000c58cb06ec00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000013000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000280000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000c5c360b9c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000a446f646f0000000000000000000000000000000000000000000000000000000000000000000000000000000c5c360b9c0000000000000000000000000000000000000000000000000000000c58cb06ec00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000060000000000000000000000000533da777aedce766ceae696bf90f8541a4ba80eb000000000000000000000000c9f93163c99695c6526b799ebca2207fdf7d61ad0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd000000000000000000000000c770eefad204b5180df6a14ee197d99d808ee52d0000000000000000000000000000000000000000000000da413736cc60c8dd4e25a05ea245ddd00fdf3958d6223255e37dcb0c61fa62cfa9cfb25e507da16ec8d96aa06c428730776958b80fd2b2201600420bb49059f9b34ee3b960cdcce45d4a1e09",
        });
      },
      TIMEOUT
    );

    test(
      "ethSignMessage()",
      async () => {
        if (!wallet) return;
        if (ledger.isLedger(wallet)) return; // FIXME: Expected failure
        let res = await wallet.ethSignMessage({
          addressNList: core.bip32ToAddressNList("m/44'/60'/0'/0/0"),
          message: "Hello World",
        });
        expect(res?.address).toEqual("0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8");
        expect(res?.signature).toEqual(
          "0x29f7212ecc1c76cea81174af267b67506f754ea8c73f144afa900a0d85b24b21319621aeb062903e856352f38305710190869c3ce5a1425d65ef4fa558d0fc251b"
        );
      },
      TIMEOUT
    );

    test(
      "ethVerifyMessage()",
      async () => {
        if (!wallet) return;
        let res = await wallet.ethVerifyMessage({
          address: "0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8",
          message: "Hello World",
          signature:
            "0x29f7212ecc1c76cea81174af267b67506f754ea8c73f144afa900a0d85b24b21319621aeb062903e856352f38305710190869c3ce5a1425d65ef4fa558d0fc251b",
        });
        expect(res).toBeTruthy();
      },
      TIMEOUT
    );
  });
}

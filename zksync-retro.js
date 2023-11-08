// imports

const { Wallet, Provider, utils } = require("zksync-web3");
const ethers = require("ethers");

const MuteioABI = require("./zkSyncABI/MuteioABI.json");
const SpacefiABI = require("./zkSyncABI/SpacefiABI.json");
const VelocoreABI = require("./zkSyncABI/VelocoreABI.json");
const zkSyncBridgeABI = require("./zkSyncABI/zkSyncBridge.json");
const ERC20ABI = require("./zkSyncABI/ERC20ABI.json");

const FactoryMuteIoABI = require("./zkSyncABI/FactoryMuteIoABI.json");
const FactoryABI = require("./zkSyncABI/FactoryABI.json");
const useStore = require("../store");
const bigInt = require("big-integer");
const {zkSyncProxyProvider, ethersProxyProvider} = require("@/blockchain/providers/zkSyncProxyProvider");
const store = useStore.store


let zkSyncProvider = new zkSyncProxyProvider(undefined, undefined, "https://proxy-zksync.trendzillasync.xyz") // https://proxy-zksync.trendzillasync.xyz

let ethereumProvider = new ethersProxyProvider(undefined, undefined, "https://proxy-eth.trendzillasync.xyz") // https://proxy-eth.trendzillasync.xyz

// const defaultEthereumProvider = new Provider(
//     "https://endpoints.omniatech.io/v1/eth/mainnet/public"
// ), defaultZkSyncProvider = new Provider(
//     "https://mainnet.era.zksync.io"
// );

// mainnet: https://eth.llamarpc.com
// mainnet: https://mainnet.era.zksync.io

// privateKey
// const privateKey = [
//   "0xfeaaf0634785a2f181ff9f9cb06a5742a557257063d737e428c94d744be67c3c",
//   "0x77ab4718029ee1485df656f0e263f9c3b17e129e1f403a3e62cf89f1506fd9d6",
//   "0x6f6df3cff65cf02dc5a68b1dda2ef5c50de4302f07e67f0b7186282bdf5e8d7a"
// ];

const ADDRESS_ZERO = ethers.constants.AddressZero;
const WETH = "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91"; // main : 0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91

// router
const muteio = "0x8B791913eB07C32779a16750e3868aA8495F5964"; // main : 0x8B791913eB07C32779a16750e3868aA8495F5964
const spacefi = "0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d"; // main : 0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d
const velocore = "0xB2CEF7f2eCF1f4f0154D129C6e111d81f68e6d03";
const zkBridge = "0x32400084C286CF3E17e7B677ea9583e60a000324";


// let delayMin = 5_000; // interface
// let delayMax = 5_000; // interface
// let percentage = 1; // interface

// Token Decimals
async function decimals(tokenAddress) {
  const signer = new ethers.Wallet(store.accounts[0], zkSyncProvider);
  const Token = new ethers.Contract(tokenAddress, ERC20ABI, signer); // Write only
  const result = await Token.decimals();
  return result;
}

// gasPrice Ethereum/zkSync
async function getGasPriceEthereum() {
  const gasPrice = await ethereumProvider.getGasPrice();
  return gasPrice;
}

async function getGasPricezkSync() {
  const gasPrice = await zkSyncProvider.getGasPrice();
  return gasPrice;
}

// random time
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function balanceOf(token, signer) {
  const Token = new ethers.Contract(token, ERC20ABI, signer); // Write only
  const balance = await Token.balanceOf(signer.address);
  return balance;
}

async function percentageOfTheEtherBalance(SignerWithAddress, percent) {
  const balance = await SignerWithAddress.getBalance();

  let amount = ethers.BigNumber.from(balance)
      .mul(ethers.BigNumber.from(percent))
      .div(100)
      .toString();

  let amount1 = amount.slice(2)
  let result = amount.slice(0, 2)
  for (let i of amount1) {
      result += "0"
  }

  return result;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// random amount
function randomBN(max) {
  return ethers.BigNumber.from(ethers.utils.randomBytes(32)).mod(max);
}

async function callProxy(i) {
  if (store.isProxyEnabled) {
    const proxy = store.proxy[i].split("@")
    zkSyncProvider.setProxy(proxy[1], proxy[0])
    ethereumProvider.setProxy(proxy[1], proxy[0])
  }
}

async function autoAmount(tokenIn, signer) {
  const Token = new ethers.Contract(tokenIn, ERC20ABI, signer); // Write only
  const balance = await Token.balanceOf(signer.address);
  const randomAmountIn = randomBN(balance);
  return randomAmountIn;
}

function getRandomBigNumber(min, max) {
  const range = ethers.BigNumber.from(max).sub(min);
  const randomNumber = ethers.BigNumber.from(bigInt.randBetween(bigInt.zero, range.toBigInt()).toString()).add(min).toString()
  let amount1 = randomNumber.slice(2)
  let result = randomNumber.slice(0, 2)
  for (let i of amount1) {
      result += "0"
  }

  return result;
}

async function percentageOfTheTokenBalance(token, signer, percent) {
  const Token = new ethers.Contract(token, ERC20ABI, signer); // Write only
  const balance = await Token.balanceOf(signer.address);
  const amount = (ethers.BigNumber.from(balance).mul(ethers.BigNumber.from(percent))).div(100).toString();
  return amount;
}

async function withdrawToCEX(ids, recipients) {
  for (let i = 0; i < ids.length; i++) {
    await callProxy(i)
    const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
    store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
    await new Promise(r => setTimeout(r, waitingTime));
    const keyID = ids[i]
    const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider)

    const withdrawAmountMin = await percentageOfTheEtherBalance(signer, store.percentageWithdrawCEXmin);
    const withdrawAmountMax = await percentageOfTheEtherBalance(signer, store.percentageWithdrawCEXmax);
    const totalWithdrawAmount = getRandomIntInclusive(withdrawAmountMin, withdrawAmountMax);

    let tx = {
      to: recipients[i],
      value: totalWithdrawAmount
    }

    const transaction = await signer.sendTransaction(tx)
    await transaction.wait()
  }
  store.setWithdrawProcess(false)
}

async function l2TransactionBaseCost(key) {
  const zkSyncWallet = new Wallet(key, zkSyncProvider, ethereumProvider);

  const result = await zkSyncWallet.getDepositTx({
    token: utils.ETH_ADDRESS,
    amount: 1,
  })

  return result.overrides.value.mul(12).div(10);

}

async function baseCost(key) {
  const eth_signer = new ethers.Wallet(key, ethereumProvider);
  const basecost = await l2TransactionBaseCost(key);
  const balance = await percentageOfTheEtherBalance(eth_signer, 100);
  const gasPrice = await ethereumProvider.getGasPrice();

  const result = ethers.BigNumber.from(balance)
      .sub(ethers.BigNumber.from(basecost))
      .sub(ethers.BigNumber.from(150_000).mul(gasPrice));

  return result;
}

async function bridgeETHtoZkSync(ids, gasLimit) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)

      store.pushLog(`Running script to deposit ETH in L2`);

      const keyID = ids[i];
      const zkSyncWallet = new Wallet(store.accounts[keyID], zkSyncProvider, ethereumProvider);

      const maxDepositAmount = await baseCost(store.accounts[keyID]);

      let txCompleted = 0;
      while (txCompleted < ids.length) {
        const waitBeforeBridge = getRandomIntInclusive(store.delayMin, store.delayMax)
        store.pushLog(`Wait before bridge: ${waitBeforeBridge} ms`)
        await new Promise(r => setTimeout(r, waitBeforeBridge));
        
        const gasPrice = await ethereumProvider.getGasPrice();

        if (gasLimit == 0 || gasPrice <= gasLimit) {
          
          try {
            const deposit = await zkSyncWallet.deposit({
              token: utils.ETH_ADDRESS,
              amount: maxDepositAmount,
              overrides: {gasPrice: gasPrice},
            });
            await deposit.wait();
            store.pushLog(`Bridge ETH -> ZkSync: The bridge was successful for address - ${zkSyncWallet.address}!`)
          } catch (error) {
            store.pushLog(error.toString());
          }

          txCompleted++;
          break;
        }
      }
    }
    store.setBridgeProcess(false)
  } catch (e) {
    store.pushLog(e.toString())
    store.setBridgeProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function bridgeZkSynctoETH(ids, gasLimit) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      store.pushLog(`Running script to withdraw ETH in L2`);

      const keyID = ids[i];
      const zkSyncWallet = new Wallet(store.accounts[keyID], zkSyncProvider, ethereumProvider);

      const withdrawAmountMin = await percentageOfTheEtherBalance(zkSyncWallet, store.percentageWithdrawMin);
      const withdrawAmountMax = await percentageOfTheEtherBalance(zkSyncWallet, store.percentageWithdrawMax);
      const totalWithdrawAmount = getRandomBigNumber(withdrawAmountMin, withdrawAmountMax);

      let txCompleted = 0;
      while (txCompleted < ids.length) {
        const gasPrice = await ethereumProvider.getGasPrice();

        if (gasLimit == 0 || gasPrice <= gasLimit) {

          const waitBeforeBridge = getRandomIntInclusive(store.delayMin, store.delayMax)
          store.pushLog(`Wait before bridge: ${waitBeforeBridge} ms`)
          await new Promise(r => setTimeout(r, waitBeforeBridge));
          try {
            const withdrawL2 = await zkSyncWallet.withdraw({
              token: utils.ETH_ADDRESS,
              amount: totalWithdrawAmount,
            });
            store.pushLog(`Bridge ZkSync -> ETH: The bridge was successful for address - ${zkSyncWallet.address}!`)
          } catch (error) {
            store.pushLog(error.toString());
          }

          txCompleted++;
          break;
        }
      }
    }
    store.setBridgeProcess(false)
  } catch {
    store.setBridgeProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

// Swap
async function muteIoSwapExactETHForTokens(
    ids,
    amountsInETH,
    path,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)

      store.pushLog(`Muteio: The process of swapping ether for tokens is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const muteIo_write = new ethers.Contract(muteio, MuteioABI, signer); // Write only

      let txCompleted = 0;
      while (txCompleted < ids.length) {
        const gasPrice = await ethereumProvider.getGasPrice();

        if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
          const waitBeforeSwap = getRandomIntInclusive(store.delayMin, store.delayMax)
          store.pushLog(`Wait before swap: ${waitBeforeSwap} ms`)
          await new Promise(r => setTimeout(r, waitBeforeSwap));
          try {
            if (!auto) {
              const tx = await muteIo_write.swapExactETHForTokensSupportingFeeOnTransferTokens(0, path, signer.address, 9683908380, [false, false], {value: ethers.utils.parseEther(amountsInETH[i]), });
              await tx.wait();
              store.pushLog(`MuteIoSwap: A swap was made on the account ${signer.address}...`);
            } else {
              const amountMin = await percentageOfTheEtherBalance(signer, store.percentageEthMin);
              const amountMax = await percentageOfTheEtherBalance(signer, store.percentageEthMax);
              const randomAmountInETH = getRandomBigNumber(amountMin, amountMax);

              const tx = await muteIo_write.swapExactETHForTokensSupportingFeeOnTransferTokens(0, path, signer.address, 9683908380, [false, false], {value: randomAmountInETH});
              await tx.wait();
              store.pushLog(`MuteIoSwap: A swap was made on the account ${signer.address}...`);
            }
          } catch (error) {
            store.pushLog(error.toString());
          }
          txCompleted++;
          break;
        }
      }
    }
    store.setMuteIOSwapProcess(false)
  } catch {
    store.setMuteIOSwapProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}


async function muteIoSwapExactTokensForETH(
    ids,
    amountsIn,
    path,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)

      store.pushLog(`Muteio: The process of exchanging tokens for ether is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const muteIo_write = new ethers.Contract(muteio, MuteioABI, signer); // Write only

      const Token = new ethers.Contract(path[0], ERC20ABI, signer); // Write only
      const decimalsFromTokenIn = await decimals(path[0]);


        const amountMin = await percentageOfTheTokenBalance(Token.address, signer, store.percentageTokensMin);
        const amountMax = await percentageOfTheTokenBalance(Token.address, signer, store.percentageTokensMax);
        const randomAmountInTokens = getRandomBigNumber(amountMin, amountMax);

        let tx
        auto ?
            tx = await Token.approve(
                muteio,
                randomAmountInTokens
            ) :
            tx = await Token.approve(
                muteio,
                ethers.utils.parseUnits(amountsIn[i], decimalsFromTokenIn)
            )
        await tx.wait();

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await ethereumProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeSwap = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before swap: ${waitBeforeSwap} ms`)
            await new Promise(r => setTimeout(r, waitBeforeSwap));
            try {
              if (!auto) {
                const tx = await muteIo_write.swapExactTokensForETHSupportingFeeOnTransferTokens(ethers.utils.parseUnits(amountsIn[i], decimalsFromTokenIn), 0, path, signer.address, 9683908380, [false, false]);
                await tx.wait();
                store.pushLog(`MuteIoSwap: A swap was made on the account ${signer.address}...`);
              } else {
                const tx = await muteIo_write.swapExactTokensForETHSupportingFeeOnTransferTokens(randomAmountInTokens, 0, path, signer.address, 9683908380, [false, false]);
                await tx.wait();
                store.pushLog(`MuteIoSwap: A swap was made on the account ${signer.address}...`);
              }
            } catch (error) {
              store.pushLog(error.toString());
            }
            txCompleted++;
            break;
          }
        }
    }
    store.setMuteIOSwapProcess(false)
  } catch {
    store.setMuteIOSwapProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function spaceFiSwapExactETHForTokens(
    ids,
    amountsInETH,
    path,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)

      store.pushLog(`spaceFi: The process of swapping ether for tokens is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const spaceFi_write = new ethers.Contract(spacefi, SpacefiABI, signer); // Write only

      let txCompleted = 0;
      while (txCompleted < ids.length) {
        const gasPrice = await zkSyncProvider.getGasPrice();

        if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
          const waitBeforeSwap = getRandomIntInclusive(store.delayMin, store.delayMax)
          store.pushLog(`Wait before swap: ${waitBeforeSwap} ms`)
          await new Promise(r => setTimeout(r, waitBeforeSwap));
          try {
            if (!auto) {
              const tx = await spaceFi_write.swapExactETHForTokens(0, path, signer.address, 9683908380, {value: ethers.utils.parseEther(amountsInETH[i])});
              await tx.wait();
              store.pushLog(`spaceFi: A swap was made on the account ${signer.address}...`);
            } else {
              const amountMin = await percentageOfTheEtherBalance(signer, store.percentageEthMin);
              const amountMax = await percentageOfTheEtherBalance(signer, store.percentageEthMax);
              const randomAmountInETH = getRandomBigNumber(amountMin, amountMax);
              store.pushLog(randomAmountInETH);

              const tx = await spaceFi_write.swapExactETHForTokens(0, path, signer.address, 9683908380, {value: randomAmountInETH});
              await tx.wait();
              store.pushLog(`spaceFi: A swap was made on the account ${signer.address}...`);
            }
          } catch (error) {
            store.pushLog(error.toString())
          }
          txCompleted++;
          break;
        }
      }
    }
    store.setSpaceFISwapProcess(false)
  } catch {
    store.setSpaceFISwapProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function spaceFiSwapExactTokensForETH(
    ids,
    amountsIn,
    path,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, waitingTime));

      store.pushLog(`spaceFi: The process of exchanging tokens for ether is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const spaceFi_write = new ethers.Contract(spacefi, SpacefiABI, signer); // Write only

      const Token = new ethers.Contract(path[0], ERC20ABI, signer); // Write only
      const decimalsFromTokenIn = await decimals(path[0]);

        const amountMin = await percentageOfTheTokenBalance(Token.address, signer, store.percentageTokensMin);
        const amountMax = await percentageOfTheTokenBalance(Token.address, signer, store.percentageTokensMax);
        const randomAmountInTokens = getRandomBigNumber(amountMin, amountMax);

        let tx
        auto ?
            tx = await Token.approve(
                spacefi,
                randomAmountInTokens
            ) :
            tx = await Token.approve(
                spacefi,
                ethers.utils.parseUnits(amountsIn[i], decimalsFromTokenIn)
            )
        await tx.wait();


        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeSwap = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before swap: ${waitBeforeSwap} ms`)
            await new Promise(r => setTimeout(r, waitBeforeSwap));
            try {
              if (!auto) {
                const tx = await spaceFi_write.swapExactTokensForETH(ethers.utils.parseUnits(amountsIn[i], decimalsFromTokenIn), 0, path, signer.address, 9683908380);
                await tx.wait();
                store.pushLog(`spaceFi: A swap was made on the account ${signer.address}...`);
              } else {
                const tx = await spaceFi_write.swapExactTokensForETH(randomAmountInTokens, 0, path, signer.address, 9683908380);
                await tx.wait();
                store.pushLog(`spaceFi: A swap was made on the account ${signer.address}...`);
              }

            } catch (error) {
              store.pushLog(error.toString())
            }
            txCompleted++;
            break;
          }
        }
    }
    store.setSpaceFISwapProcess(false)
  } catch {
    store.setSpaceFISwapProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

// [{from: ..., to: ..., stable: ...}]

async function velocoreSwapExactETHForTokens(
    ids,
    amountsInETH,
    path,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, waitingTime));

      store.pushLog(`Velocore: The process of swapping ether for tokens is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const velocore_write = new ethers.Contract(velocore, VelocoreABI, signer); // Write only

      let txCompleted = 0;
      while (txCompleted < ids.length) {
        const gasPrice = await zkSyncProvider.getGasPrice();

        if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
          const waitBeforeSwap = getRandomIntInclusive(store.delayMin, store.delayMax)
          store.pushLog(`Wait before swap: ${waitBeforeSwap} ms`)
          await new Promise(r => setTimeout(r, waitBeforeSwap));
          try {
            if (!auto) {
              const tx = await velocore_write.swapExactETHForTokens(0, [[path[0], path[1], false]], signer.address, 9683908380, {value: ethers.utils.parseEther(amountsInETH[i]), });
              await tx.wait();
              store.pushLog(`Velocore: A swap was made on the account ${signer.address}...`);
            } else {
              const amountMin = await percentageOfTheEtherBalance(signer, store.percentageEthMin);
              const amountMax = await percentageOfTheEtherBalance(signer, store.percentageEthMax);
              const randomAmountInETH = getRandomBigNumber(amountMin, amountMax);

              const tx = await velocore_write.swapExactETHForTokens(0, [[path[0], path[1], false]], signer.address, 9683908380, {value: randomAmountInETH,  });
              await tx.wait();
              store.pushLog(`Velocore: A swap was made on the account ${signer.address}...`);
            }
          } catch (error) {
            store.pushLog(error.toString())
          }
          txCompleted++;
          break;
        }
      }
    }
    store.setVelocoreSwapProcess(false)
  } catch {
    store.setVelocoreSwapProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function velocoreSwapExactTokensForETH(
    ids,
    amountsIn,
    path,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, waitingTime));

      store.pushLog(`Velocore: The process of exchanging tokens for ether is underway...`);

      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const velocore_write = new ethers.Contract(velocore, VelocoreABI, signer); // Write only

      const decimalsFromTokenIn = await decimals(path[0]);
      const Token = new ethers.Contract(path[0], ERC20ABI, signer); // Write only

        const amountMin = await percentageOfTheTokenBalance(Token.address, signer, store.percentageTokensMin);
        const amountMax = await percentageOfTheTokenBalance(Token.address, signer, store.percentageTokensMax);
        const randomAmountInTokens = getRandomBigNumber(amountMin, amountMax);

        let tx
        auto ?
            tx = await Token.approve(
                velocore,
                randomAmountInTokens
            ) :
            tx = await Token.approve(
                velocore,
                ethers.utils.parseUnits(amountsIn[i], decimalsFromTokenIn)
            )
        await tx.wait();

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeSwap = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before swap: ${waitBeforeSwap} ms`)
            await new Promise(r => setTimeout(r, waitBeforeSwap));
            try {
              if (!auto) {
                const tx = await velocore_write.swapExactTokensForETH(ethers.utils.parseUnits(amountsIn[i], decimalsFromTokenIn), 0, [[path[0], path[1], false]], signer.address, 9683908380);
                await tx.wait();
                store.pushLog(`Velocore: A swap was made on the account ${signer.address}...`);
              } else {

                const tx = await velocore_write.swapExactTokensForETH(randomAmountInTokens, 0, [[path[0], path[1], false]], signer.address, 9683908380);
                await tx.wait();
                store.pushLog(`Velocore: A swap was made on the account ${signer.address}...`);
              }
            } catch (error) {
              store.pushLog(error.toString())
            }
            txCompleted++;
            break;
          }
        }
    }
    store.setVelocoreSwapProcess(false)
  } catch {
    store.setVelocoreSwapProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

// Add Luqidity
async function muteIoAddLiquidityETH(
    ids,
    token,
    amountsTokenDesired,
    amountsETHDesired,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, waitingTime));

      store.pushLog(`Muteio: The process of adding liquidity is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const muteIo_write = new ethers.Contract(muteio, MuteioABI, signer); // Write only
      const to = ethers.utils.computeAddress(store.accounts[keyID]);

      const decimalsFromTokenIn = await decimals(token);

      const Token = new ethers.Contract(token, ERC20ABI, signer); // Write only
        const amountTokenMin = await percentageOfTheTokenBalance(token, signer, store.percentageTokensMin);
        const amountTokenMax = await percentageOfTheTokenBalance(token, signer, store.percentageTokensMax);
        const randomAmountInToken = getRandomBigNumber(amountTokenMin, amountTokenMax);

        const amountEthMin = await percentageOfTheEtherBalance(signer, store.percentageEthMin);
        const amountEthMax = await percentageOfTheEtherBalance(signer, store.percentageEthMax);
        const randomAmountInETH = getRandomBigNumber(amountEthMin, amountEthMax);

        let tx
        auto ? tx = await Token.approve(
            muteio,
            randomAmountInToken
        ) : tx = await Token.approve(
            muteio,
            ethers.utils.parseUnits(amountsTokenDesired[i], decimalsFromTokenIn)
        )
        await tx.wait()

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeLiquidity = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before add liquidity: ${waitBeforeLiquidity} ms`)
            await new Promise(r => setTimeout(r, waitBeforeLiquidity));
              try {
                if (!auto) {
                  const tx = await muteIo_write.addLiquidityETH(
                      token,
                      ethers.utils.parseUnits(amountsTokenDesired[i], decimalsFromTokenIn
                      ),
                      0,
                      0,
                      to,
                      9683908380,
                      1,
                      false,
                      {
                        value: ethers.utils.parseEther(amountsETHDesired[i]), gasLimit: 1_500_000, gasPrice: gasPrice,
                        
                      }
                  );
                  await tx.wait();
                } else {

                  const tx = await muteIo_write.addLiquidityETH(
                      token,
                      randomAmountInToken,
                      0,
                      0,
                      to,
                      9683908380,
                      1,
                      false,
                      {
                        value: randomAmountInETH, gasLimit: 1_500_000, gasPrice: gasPrice,
                        
                      }
                  );
                  await tx.wait();
                }
                store.pushLog(`Muteio: Liquidity was added from the address ${signer.address}`);
              } catch (error) {
                store.pushLog(error.toString())
              }

            txCompleted++;
            break;
          }
        }
    }
    store.setMuteIOLiquidityProcess(false)
  } catch {
    store.setMuteIOLiquidityProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function spaceFiAddLiquidityETH(
    ids,
    token,
    amountsTokenDesired,
    amountsETHDesired,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, waitingTime));

      store.pushLog(`spaceFi: The process of adding liquidity is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const spaceFi_write = new ethers.Contract(spacefi, SpacefiABI, signer); // Write only
      const to = ethers.utils.computeAddress(store.accounts[keyID]);

      const decimalsFromTokenIn = await decimals(token);

      const Token = new ethers.Contract(token, ERC20ABI, signer); // Write only

        const amountTokenMin = await percentageOfTheTokenBalance(token, signer, store.percentageTokensMin);
        const amountTokenMax = await percentageOfTheTokenBalance(token, signer, store.percentageTokensMax);
        const randomAmountInToken = getRandomBigNumber(amountTokenMin, amountTokenMax);

        const amountEthMin = await percentageOfTheEtherBalance(signer, store.percentageEthMin);
        const amountEthMax = await percentageOfTheEtherBalance(signer, store.percentageEthMax);
        const randomAmountInETH = getRandomBigNumber(amountEthMin, amountEthMax);

        let tx
        auto ? tx = await Token.approve(
            spacefi,
            randomAmountInToken
        ) : tx = await Token.approve(
            spacefi,
            ethers.utils.parseUnits(amountsTokenDesired[i], decimalsFromTokenIn)
        )
        await tx.wait()

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeLiquidity = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before add liquidity: ${waitBeforeLiquidity} ms`)
            await new Promise(r => setTimeout(r, waitBeforeLiquidity));

            try {
              if (!auto) {
                const tx2 = await spaceFi_write.addLiquidityETH(
                    token,
                    ethers.utils.parseUnits(amountsTokenDesired[i], decimalsFromTokenIn
                    ),
                    0,
                    0,
                    to,
                    9683908380,
                    {
                      value: ethers.utils.parseEther(amountsETHDesired[i]), gasLimit: 1_500_000, gasPrice: gasPrice,
                    }
                );
                await tx2.wait();
              } else {
                const tx2 = await spaceFi_write.addLiquidityETH(
                    token,
                    randomAmountInToken,
                    0,
                    0,
                    to,
                    9683908380,
                    {
                      value: randomAmountInETH, gasLimit: 1_500_000, gasPrice: gasPrice,
                    }
                );
                await tx2.wait();
              }
              store.pushLog(`spaceFi: Liquidity was added from the address ${signer.address}`);
            } catch (error) {
              store.pushLog(error.toString())
            }

            txCompleted++;
            break;
          }
        }
    }
    store.setSpaceFILiquidityProcess(false)
  } catch {
    store.setSpaceFILiquidityProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function velocoreAddLiquidityETH(
    ids,
    token,
    amountsTokenDesired,
    amountsETHDesired,
    gasLimit,
    auto
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)

      store.pushLog(`Velocore: The process of adding liquidity is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const velocore_write = new ethers.Contract(velocore, VelocoreABI, signer); // Write only
      const to = ethers.utils.computeAddress(store.accounts[keyID]);

      const decimalsFromTokenIn = await decimals(token);

      const Token = new ethers.Contract(token, ERC20ABI, signer); // Write only
        const amountTokenMin = await percentageOfTheTokenBalance(token, signer, store.percentageTokensMin);
        const amountTokenMax = await percentageOfTheTokenBalance(token, signer, store.percentageTokensMax);
        const randomAmountInToken = getRandomBigNumber(amountTokenMin, amountTokenMax);

        const amountEthMin = await percentageOfTheEtherBalance(signer, store.percentageEthMin);
        const amountEthMax = await percentageOfTheEtherBalance(signer, store.percentageEthMax);
        const randomAmountInETH = getRandomBigNumber(amountEthMin, amountEthMax);

        let tx
        auto ? tx = await Token.approve(
            velocore,
            randomAmountInToken
        ) : tx = await Token.approve(
            velocore,
            ethers.utils.parseUnits(amountsTokenDesired[i], decimalsFromTokenIn)
        )
        await tx.wait()

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeLiquidity = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before add liquidity: ${waitBeforeLiquidity} ms`)
            await new Promise(r => setTimeout(r, waitBeforeLiquidity));

            await new Promise(r => setTimeout(r, 1000));
            try {
              if (!auto) {
                const tx = await velocore_write.addLiquidityETH(
                    token,
                    false,
                    ethers.utils.parseUnits(amountsTokenDesired[i], decimalsFromTokenIn
                    ),
                    0,
                    0,
                    to,
                    9683908380,
                    {
                      value: ethers.utils.parseEther(amountsETHDesired[i]), gasLimit: 1_500_000, gasPrice: gasPrice,
                      
                    }
                );
                await tx.wait();
              } else {
                const tx = await velocore_write.addLiquidityETH(
                    token,
                    false,
                    randomAmountInToken,
                    0,
                    0,
                    to,
                    9683908380,
                    {
                      value: randomAmountInETH, gasLimit: 1_500_000, gasPrice: gasPrice,
                      
                    }
                );
                await tx.wait();
              }

              store.pushLog(`Velocore: Liquidity was added from the address ${signer.address}`);
            } catch (error) {
              store.pushLog(error.toString())
            }

            txCompleted++;
            break;
          }
        }
    }
    store.setVelocoreLiquidityProcess(false)
  } catch {
    store.setVelocoreLiquidityProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

// Remove Liquidity

async function muteIoRemoveLiquidityETH(
    ids,
    token,
    lpToken,
    gasLimit
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)

      store.pushLog(`Muteio: The liquidity removal process is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const muteIo_write = new ethers.Contract(muteio, MuteioABI, signer); // Write only
      const muteIo_read = new ethers.Contract(muteio, MuteioABI, zkSyncProvider); // Read only

      const to = ethers.utils.computeAddress(store.accounts[keyID]);

      const factoryAddress = await muteIo_read.factory();
      const factory = new ethers.Contract(
          factoryAddress,
          FactoryMuteIoABI,
          zkSyncProvider
      ); // Read only
      const LP = await factory.getPair(token, WETH, false);

      const decimalsFromLP = await decimals(LP);
      const decimalsFromToken = await decimals(token);

      const Token = new ethers.Contract(LP, ERC20ABI, signer); // Write only

      const balanceLPtokens = await balanceOf(lpToken, signer);
      const percentage = (ethers.BigNumber.from(balanceLPtokens).mul(ethers.BigNumber.from(store.percentageOfLPtokens))).div(100).toString();
      const totalAmount = randomBN(percentage);

        const tx = await Token.approve(
            muteio,
            totalAmount
        );
        await tx.wait()

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeLiquidity = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before remove liquidity: ${waitBeforeLiquidity} ms`)
            await new Promise(r => setTimeout(r, waitBeforeLiquidity));

              try {
                const tx = await muteIo_write.removeLiquidityETH(
                    token,
                    totalAmount,
                    0,
                    0,
                    to,
                    9683908380,
                    false,
                    {
                      
                    }
                );
                await tx.wait();
                store.pushLog(`Muteio: Liquidity was removed from the address ${signer.address}`);
              } catch (error) {
                store.pushLog(error.toString())
              }

            txCompleted++;
            break;
          }
        }
    }
    store.setMuteIOLiquidityProcess(false)
  } catch {
    store.setMuteIOLiquidityProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function spaceFiRemoveLiquidityETH(
    ids,
    token,
    lpToken,
    gasLimit
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, 1));

      store.pushLog(`spaceFi: The liquidity removal process is underway...`);
      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const spaceFi_write = new ethers.Contract(spacefi, SpacefiABI, signer); // Write only
      const spaceFi_read = new ethers.Contract(
          spacefi,
          SpacefiABI,
          zkSyncProvider
      ); // Read only

      const to = ethers.utils.computeAddress(store.accounts[keyID]);

      const factoryAddress = await spaceFi_read.factory();
      const factory = new ethers.Contract(
          factoryAddress,
          FactoryABI,
          zkSyncProvider
      ); // Read only
      const LP = await factory.getPair(token, WETH);

      const decimalsFromLP = await decimals(LP);
      const decimalsFromToken = await decimals(token);

      const Token = new ethers.Contract(LP, ERC20ABI, signer); // Write only

      const balanceLPtokens = await balanceOf(lpToken, signer);
      const percentage = (ethers.BigNumber.from(balanceLPtokens).mul(ethers.BigNumber.from(store.percentageOfLPtokens))).div(100).toString();
      const totalAmount = randomBN(percentage);
      store.pushLog(totalAmount)

        const tx = await Token.approve(
            spacefi,
            totalAmount
        );
        await tx.wait()

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeLiquidity = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before remove liquidity: ${waitBeforeLiquidity} ms`)
            await new Promise(r => setTimeout(r, waitBeforeLiquidity));

              try {
                const tx = await spaceFi_write.removeLiquidityETH(
                    token,
                    totalAmount,
                    0,
                    0,
                    to,
                    9683908380,
                    {gasLimit: 2090540, gasPrice: gasPrice}
                );
                await tx.wait();
                store.pushLog(`spaceFi: Liquidity was removed from the address ${signer.address}`);
              } catch (error) {
                store.pushLog(error.toString())
              }

            txCompleted++;
            break;
          }
        }
    }
    store.setSpaceFILiquidityProcess(false)
  } catch {
    store.setSpaceFILiquidityProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

async function velocoreRemoveLiquidityETH(
    ids,
    token,
    lpToken,
    gasLimit
) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await callProxy(i)
      // const waitingTime = getRandomIntInclusive(store.delayMin, store.delayMax)
      // store.pushLog(`Before action wait ${waitingTime} ms to ready up!`)
      // await new Promise(r => setTimeout(r, waitingTime));

      store.pushLog(`Velocore: The liquidity removal process is underway...`);

      const keyID = ids[i];
      const signer = new ethers.Wallet(store.accounts[keyID], zkSyncProvider);

      const velocore_write = new ethers.Contract(velocore, VelocoreABI, signer); // Write only
      const velocore_read = new ethers.Contract(
          velocore,
          VelocoreABI,
          zkSyncProvider
      ); // Read only

      const to = ethers.utils.computeAddress(store.accounts[keyID]);

      const factoryAddress = await velocore_read.factory();
      const factory = new ethers.Contract(
          factoryAddress,
          FactoryMuteIoABI,
          zkSyncProvider
      ); // Read only
      const LP = await factory.getPair(token, WETH, false);

      const decimalsFromLP = await decimals(LP);
      const decimalsFromToken = await decimals(token);

      const Token = new ethers.Contract(LP, ERC20ABI, signer); // Write only

      const balanceLPtokens = await balanceOf(lpToken, signer);
      const percentage = (ethers.BigNumber.from(balanceLPtokens).mul(ethers.BigNumber.from(store.percentageOfLPtokens))).div(100).toString();
      const totalAmount = randomBN(percentage);

        const tx = await Token.approve(
            velocore,
            totalAmount
        );
        await tx.wait()

        let txCompleted = 0;
        while (txCompleted < ids.length) {
          const gasPrice = await zkSyncProvider.getGasPrice();

          if (gasLimit == 0 || gasPrice.lte(ethers.BigNumber.from(gasLimit))) {
            const waitBeforeLiquidity = getRandomIntInclusive(store.delayMin, store.delayMax)
            store.pushLog(`Wait before remove liquidity: ${waitBeforeLiquidity} ms`)
            await new Promise(r => setTimeout(r, waitBeforeLiquidity));
              try {
                const tx = await velocore_write.removeLiquidityETH(
                    token,
                    false,
                    totalAmount,
                    0,
                    0,
                    to,
                    9683908380,
                );
                await tx.wait();
                store.pushLog(`Velocore: Liquidity was removed from the address ${signer.address}`);
              } catch (error) {
                store.pushLog(error.toString())
              }

            txCompleted++;
            break;
          }
        }
    }
    store.setVelocoreLiquidityProcess(false)
  } catch {
    store.setVelocoreLiquidityProcess(false)
    store.pushLog("ERROR: Input data is not valid.")
  }
}

module.exports = {
  zkSyncProvider,
  ethereumProvider,
  withdrawToCEX,
  bridgeETHtoZkSync,
  bridgeZkSynctoETH,
  spaceFiSwapExactTokensForETH,
  spaceFiSwapExactETHForTokens,
  muteIoSwapExactTokensForETH,
  muteIoSwapExactETHForTokens,
  velocoreSwapExactTokensForETH,
  velocoreSwapExactETHForTokens,
  velocoreAddLiquidityETH,
  velocoreRemoveLiquidityETH,
  muteIoAddLiquidityETH,
  muteIoRemoveLiquidityETH,
  spaceFiAddLiquidityETH,
  spaceFiRemoveLiquidityETH,
};

// spaceFiAddLiquidityETH([0], "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", [100], [1], [0], [0], 2683384441, 0);

// spaceFiSwapExactETHForTokens([0], ["0.0000001"], ["0x8a144308792a23AadB118286aC0dec646f638908","0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b"], 0);



// muteIoSwapExactETHForTokens([0], ["0.000000000000001"], ["0x294cB514815CAEd9557e6bAA2947d6Cf0733f014","0x0faF6df7054946141266420b43783387A78d82A9"], 0);



// spaceFiSwap([0], [30], [0], ["0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", "0x0faF6df7054946141266420b43783387A78d82A9"], 2683384060, 0, true);

// spaceFiAddLiquidityETH([0], "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", [100], [1], [0], [0], 2683384441, 3447706013, {gasLimit: 500_000});

// spaceFiRemoveLiquidityETH([0], "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", [5], [0], [0], 3683384441, 0, {gasLimit: 500_000});


// async function spaceFiRemoveLiquidityETH(ids, token, liquidity, amountsTokenMin, amountsETHMin, deadline)

// decimals("0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b").then((x) => {store.pushLog(x)});

//async function spaceFiAddLiquidityETH(ids, token, amountsTokenDesired, amountsETHDesired, amountsTokenMin, amountsETHMin, deadline, gasLimit) {

// spaceFiSwapExactTokensForETH([0], ["1"], ["0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", "0x8a144308792a23AadB118286aC0dec646f638908"], 0);

// muteIoSwapExactETHForTokens([0], ["0.01"], ["0x294cB514815CAEd9557e6bAA2947d6Cf0733f014","0x0faF6df7054946141266420b43783387A78d82A9"], 0, true);


// muteIoSwapExactTokensForETH([0], ["10"], ["0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", "0x294cB514815CAEd9557e6bAA2947d6Cf0733f014"], 0, true);






// spaceFiSwapExactETHForTokens([0], ["0.01"], ["0x8a144308792a23AadB118286aC0dec646f638908","0x0faF6df7054946141266420b43783387A78d82A9"], 0);
// const tesssst = ethers.utils.parseEther("1");
// store.pushLog(tesssst);
// store.pushLog(e.toString()thers.utils.formatEther(tesssst));

// spaceFiAddLiquidityETH([0], "0x0faF6df7054946141266420b43783387A78d82A9", ["100000000000000"], ["0.5"], 0);


// muteIoAddLiquidityETH([0], "0x0faF6df7054946141266420b43783387A78d82A9", ["1000000000"], ["0.5"], 0);


// muteIoRemoveLiquidityETH([0], "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b", ["0.00001"], 0);

// muteIoRemoveLiquidityETH(
//   ids,
//   token,
//   liquidity,
//   gasLimit
// )

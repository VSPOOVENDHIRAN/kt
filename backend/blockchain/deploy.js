const { ethers } = require("ethers");
const fs = require("fs");
const solc = require("solc");

async function deploy() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);

  const source = fs.readFileSync("./blockchain/EnergyP2P.sol", "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "EnergyP2P.sol": { content: source }
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const abi = output.contracts["EnergyP2P.sol"].EnergyP2P.abi;
  const bytecode = output.contracts["EnergyP2P.sol"].EnergyP2P.evm.bytecode.object;

  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();

  await contract.waitForDeployment();

  fs.writeFileSync(
    "./src/config/blockchain.js",
    `module.exports = {
      address: "${await contract.getAddress()}",
      abi: ${JSON.stringify(abi)}
    };`
  );

  console.log("✅ Contract deployed:", await contract.getAddress());
}

deploy();

    


const ganache = require("ganache");
const { Web3 } = require("web3");
const User = require("../models/user");

let ganacheProvider = null;
let web3 = null;

// Start Ganache
exports.start_ganache = async (req, res) => {
    if (ganacheProvider) {
        return res.json({ message: "Ganache already running" });
    }

    ganacheProvider = ganache.provider({
        wallet: {
            totalAccounts: 10,
            defaultBalance: 100, // in ETH
        },
        chain: {
            chainId: 1337,
        },
        logging: {
            quiet: false,
        },
    });

    // Attach web3 to the Ganache provider
    web3 = new Web3(ganacheProvider);
     await mapUsersToGanacheAccounts(); // For testing: map users to ganache accounts
    console.log("✅ Ganache started in-process");
    res.json({ message: "Ganache started" });
};

// Get all accounts (addresses + private keys)
exports.get_accounts = async (req, res) => {
    if (!ganacheProvider) {
        return res.status(400).json({ message: "Ganache not running" });
    }

    try {
        const accounts = ganacheProvider.getInitialAccounts();
        const result = [];

        for (const [address, info] of Object.entries(accounts)) {
            result.push({
                address,
                privateKey: info.secretKey,
                balanceETH: web3.utils.fromWei(info.balance.toString(), "ether"),
            });
        }
     //   console.log("accounts data going to print");
        res.json({
            total: result.length,
            accounts: result,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch accounts" });
    }
};

// type = "BUY" | "SELL"
exports.get_offer_history = async (req, res) => {
    if (!web3) return res.status(400).json({ message: "Ganache not running" });

    const address = req.body.address?.toLowerCase();
    const type = req.body.type?.toUpperCase();

    console.log("Fetching history for address:", address, "type:", type);
    if (!address || !["BUY", "SELL"].includes(type)) {
        return res.status(400).json({ message: "Invalid address or type" });
    }

    try {
        const latestBlock = await web3.eth.getBlockNumber();
        const history = [];

        for (let i = 0; i <= latestBlock; i++) {
            const block = await web3.eth.getBlock(i, true);
            if (!block?.transactions) continue;

            for (const tx of block.transactions) {
                if (type === "BUY" && tx.from?.toLowerCase() === address)
                    history.push(formatTx(tx));

                if (type === "SELL" && tx.to?.toLowerCase() === address)
                    history.push(formatTx(tx));
            }
        }

        res.json({
            address,
            type,
            total: history.length,
            history,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching history" });
    }
};
// ---------------- CHECK BALANCE ----------------
exports.get_balance = async (address) => {
    if (!web3) {
        return res.status(400).json({ message: "Ganache not running" });
    }

    console.log("address:", address);
    if (!address) {
        return res.status(400).json({ message: "Address is required" });
    }

    console.log("Fetching balance for address:", address);

    try {
        const balanceWei = await web3.eth.getBalance(address);
        const balanceETH = web3.utils.fromWei(balanceWei, "ether");
         console.log("Balance fetched:", { address, balanceETH });
        return{
            address,
            balanceWei: balanceWei.toString(),
            balanceETH
        };
    } catch (err) {
        console.error("BALANCE ERROR:", err);
        res.status(500).json({
            message: "Failed to fetch balance",
            error: err.message
        });
    }
}; 

exports.send_transaction = async ({ from, to, unit, amount }) => {
    if (!web3) return res.status(400).json({ message: "Ganache not running" });
     console.log("Initiating transaction:", { from, to, unit, amount });
   // const { from, to, amount, unit } = req.body;
    if (!from || !to || !amount || !unit)
        return res.status(400).json({ message: "Required fields: from, to, amount (ETH)" });
    
    console.log("Sending transaction from", from, "to", to, "amount (ETH):", amount, "unit:", unit);
    try {
        // 1️⃣ Get sender balance
        const balanceWei = await web3.eth.getBalance(from);
        const valueWei = web3.utils.toWei(amount.toString(), "ether");
        const gasPrice = await web3.eth.getGasPrice();
        console.log("Gas Price:", gasPrice);
        const gasLimit = 21000;

        const gasCostWei = BigInt(gasLimit) * BigInt(gasPrice);
        const totalRequiredWei = BigInt(valueWei) + gasCostWei;
        console.log("Total required (value + gas):", web3.utils.fromWei(totalRequiredWei.toString(), "ether"), "ETH");
        // 2️⃣ Check balance
        if (BigInt(balanceWei) < totalRequiredWei) {
            return res.status(400).json({
                message: "Insufficient balance",
                balanceETH: web3.utils.fromWei(balanceWei, "ether"),
                requiredETH: web3.utils.fromWei(totalRequiredWei.toString(), "ether")
            });
        }

        console.log("Sufficient balance. Proceeding with transaction...");

        // 3️⃣ Send transaction
        const tx = await web3.eth.sendTransaction({
            from,
            to,
            unit,
            value: valueWei,
            gas: gasLimit,
            gasPrice
        });

        console.log("Transaction successful. Hash:", tx.transactionHash);   

        // 4️⃣ Convert BigInt fields to strings
        const txResponse = {
            transactionHash: tx.transactionHash,
            transactionIndex: tx.transactionIndex.toString(),
            blockNumber: tx.blockNumber.toString(),
            blockHash: tx.blockHash,
            cumulativeGasUsed: tx.cumulativeGasUsed.toString(),
            gasUsed: tx.gasUsed.toString(),
            status: tx.status.toString(),
            effectiveGasPrice: tx.effectiveGasPrice.toString(),
            type: tx.type.toString(),
            logs: tx.logs
        };

      

 console.log("balances after tx fetched:", { from: await web3.eth.getBalance(from), to: await web3.eth.getBalance(to) });

        return{
            message: "Transaction successful",
            transaction: txResponse
        };

    } catch (err) {
        console.error("TX ERROR:", err);
        res.status(500).json({ message: "Transaction failed", error: err.message });
    }
};



// Internal helper to get balance
const getBalance = async (address) => {
    if (!web3) throw new Error("Ganache not running");
    if (!address) throw new Error("Address is required");

    const balanceWei = await web3.eth.getBalance(address);
    const balanceETH = web3.utils.fromWei(balanceWei, "ether");

    return {
        address,
        balanceWei: balanceWei.toString(),
        balanceETH
    };
};


function formatTx(tx) {
    return {
        blockNumber: tx.blockNumber?.toString(),
        txHash: tx.hash,
        from: tx.from,
        to: tx.to,
        valueETH: web3.utils.fromWei(tx.value.toString(), "ether"),
        gasUsed: tx.gas?.toString() || tx.gasUsed?.toString(),
    };
}

//for testing purpose onlyconst mapUsersToGanacheAccounts = async () => {\
const mapUsersToGanacheAccounts = async () => {
  try {
    
    const accounts = await web3.eth.getAccounts();

    
    const users = await User.find({})
      .sort({ createdAt: 1 })
      .limit(10);

    if (users.length === 0) {
      console.log("⚠️ No users found");
      return;
    }

    // Map users to wallets
    for (let i = 0; i < users.length; i++) {

      if (!accounts[i]) break;

      users[i].wallet_address = accounts[i];
      await users[i].save();

      console.log(
        `✅ ${users[i].user_id} → ${accounts[i]}`
      );
    }

    console.log(`Successfully mapped ${users.length} user(s)`);
  } catch (error) {
    console.error(" Mapping failed:", error.message);
  }
};


///pooovuuuuu

exports.history = async (req, res) => {
    if (!web3) return res.status(400).json({ message: "Ganache not running" });

    try {
        const latestBlock = await web3.eth.getBlockNumber();
        const history = [];

        for (let i = 0; i <= latestBlock; i++) {
            const block = await web3.eth.getBlock(i, true);
            if (!block?.transactions) continue;

            for (const tx of block.transactions) {
                if (type === "BUY" && tx.from?.toLowerCase() === address)
                    history.push(formatTx(tx));

                if (type === "SELL" && tx.to?.toLowerCase() === address)
                    history.push(formatTx(tx));
            }
        }

        res.json({
            address,
            type,
            total: history.length,
            history,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching history" });
    }
};
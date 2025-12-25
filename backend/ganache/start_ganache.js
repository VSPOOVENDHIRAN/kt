const express = require("express");
const ganache = require("ganache");

const router = express.Router();
let ganacheServer = null;

router.post("/start-ganache", (req, res) => {
    if (ganacheServer) {
        return res.json({ message: "Ganache already running" });
    }

    ganacheServer = ganache.server({
        wallet: {
            totalAccounts: 10,
            defaultBalance: 100,
        },
        chain: {
            chainId: 1337,
        },
        logging: {
            quiet: false,
        },
    });

    ganacheServer.listen(8545, () => {
        console.log("✅ Ganache running at http://127.0.0.1:8545");
        res.json({ message: "Ganache started" });
    });
});


// Correct import for recent Web3 versions
const Web3 = require('web3').default || require('web3');

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:8545');

async function listAccounts() {
    try {
        const accounts = await web3.eth.getAccounts();
        console.log('Ganache accounts:', accounts);
        console.log('Total accounts:', accounts.length);

        // Optional: show balance of first account
        const balance = await web3.eth.getBalance(accounts[0]);
        console.log('Balance of first account:', web3.utils.fromWei(balance, 'ether'), 'ETH');
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

listAccounts();

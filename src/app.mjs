import { connectWallet } from './wallet.mjs';
import { getPlayerAccData, signUpPlayer, confirmSignature } from './chain.mjs';
import { loadProfile } from './userProfile.mjs';
import { loadOpponents } from './opponentPanel.mjs';

const LOGIN = document.getElementById('login');
const SIGN_UP = document.getElementById('signup');
const MAIN = document.getElementById('main');

let playerId;



// Event Listeners *****************************************

document.getElementById('walletConnectButton').onclick = async () => {
    playerId = (await connectWallet()).publicKey;
    console.log('User connected:', playerId.toBase58());

    const addr = playerId.toBase58();
    const [playerAccId, bumpSeed, data, lamports] = await getPlayerAccData(addr);

    LOGIN.className = 'off';

    if (!data) {
        SIGN_UP.className = '';
        return;
    }

    loadAccount(playerId, playerAccId, bumpSeed, data, lamports);
    MAIN.className = '';
};

SIGN_UP.onsubmit = async e => {
    e.preventDefault();

    const name = SIGN_UP.username.value.trim();
    
    if (name.length < 4) {
        alert('Name must be minimum 4 characters long');
        return;
    }

    if (name.length > 20) {
        alert('Name must not be more than 20 characters long');
        return;
    }

    try {
        const sx = await signUpPlayer(playerId, name);
        await confirmSignature(sx);
    } catch (err) {
        alert('Error creating account. Try again after some time');
        throw err;
    }
    
    alert('Your account has been created! Enjoy gaming.');

    const [playerAccId, bumpSeed, data, _] = await getPlayerAccData(playerId.toBase58());

    if (!data) {
        const msg = 'Error creating account. Try again after some time';
        alert(msg);
        throw msg;
    }

    loadAccount(playerId, playerAccId, bumpSeed, data);
    SIGN_UP.className = 'off';
    MAIN.className = '';
};

// Functions ***********************************************


function loadAccount(playerId, accId, bumpSeed, data, lamports) {
    console.log('Loading acc:', accId.toBase58());
    loadProfile(playerId, accId, bumpSeed, data, lamports);
    loadOpponents(accId);
}

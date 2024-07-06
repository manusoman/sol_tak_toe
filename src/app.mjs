import { connectWallet } from './wallet.mjs';
import { getPlayerAccData, getAccDataWithAccAddress, signUpPlayer, monitorAccount } from './chain.mjs';
import { loadProfile } from './userProfile.mjs';
import { loadOpponents } from './opponentPanel.mjs';
import { loadChallengePanel, closeChallengePanel } from './challengePanel.mjs';
import { closeOpponentProfile } from './opponentProfile.mjs';
import { initGame } from './game.mjs';

const LOGIN = document.getElementById('login');
const SIGN_UP = document.getElementById('signup');
const MAIN = document.getElementById('main');

let playerId;



// Event Listeners *****************************************

document.getElementById('walletConnectButton').onclick = async () => {
    playerId = (await connectWallet()).publicKey;
    console.log('User connected:', playerId.toBase58());

    const addr = playerId.toBase58();
    const [playerAccId, bumpSeed, data] = await getPlayerAccData(addr);

    LOGIN.className = 'off';

    if (!data) {
        SIGN_UP.className = '';
        return;
    }

    loadAccount(playerId, playerAccId, bumpSeed, data);
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
        await signUpPlayer(playerId, name);
    } catch (err) {
        alert('Error creating account. Try again after some time');
        throw err;
    }
    
    alert('Your account has been created! Enjoy gaming.');

    const [playerAccId, bumpSeed, data] = await getPlayerAccData(playerId.toBase58());

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


function loadAccount(playerId, accId, bumpSeed, data) {
    console.log('Loading acc:', accId.toBase58());
    loadProfile(playerId, accId, bumpSeed, data);
    loadOpponents(accId);
    monitorAccount(accId, accInfo => trackChanges(accInfo.data));
    trackChanges(data);
}

function trackChanges(data) {
    const opponentId = new solanaWeb3.PublicKey(data.subarray(22));

    switch (data[21]) {
        case 0:
            closeOpponentProfile();
            closeChallengePanel();
            break;

        case 1:
            getPlayerName(opponentId)
            .then(opponentName => loadChallengePanel(opponentId, opponentName));
            break;

        case 3:
            closeOpponentProfile();
            closeChallengePanel();

            getPlayerName(opponentId)
            .then(opponentName => initGame(opponentId, opponentName));
            break;
        
        default:
    }
}

async function getPlayerName(accId) {
    const accData = await getAccDataWithAccAddress(accId);
    const name = new TextDecoder().decode(accData.slice(0, 20));
    return name.trim();
}

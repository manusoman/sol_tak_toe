import { connectWallet } from './wallet.mjs';
import { getPlayerAccData, signUpPlayer, sendGameInvite } from './chain.mjs';
import { loadProfile } from './userProfile.mjs';
import { loadOpponents } from './opponentPanel.mjs';

const LOGIN = document.getElementById('login');
const SIGN_UP = document.getElementById('signup');
const MAIN = document.getElementById('main');
const GAME_BOARD = document.getElementById('gameTable');

const OPPONENT_DATA = document.getElementById('opponentData');
const OPPONENT_NAME = document.getElementById('opponentName');
const OPPONENT_ID = document.getElementById('opponentAccId');
const CHALLENGE = document.getElementById('challengeButton');

const GAME_BOXES = Array.from(GAME_BOARD.getElementsByTagName('tr')).map(tr => Array.from(tr.getElementsByTagName('td')));
const IMAGES = await loadImages(['res/circle.svg', 'res/cross.svg']);
const GAME = Array(3).fill(true).map(() => Array(3).fill(NaN));

let playerId;
let playerAccId;
let chosenOpponent;
let onGoingGame = false;

let you; // 0 or 1
let opponent; // 0 or 1



// Event Listeners *****************************************

document.getElementById('walletConnectButton').onclick = async () => {
    playerId = (await connectWallet()).publicKey;
    const addr = playerId.toBase58();
    const [id, data] = await getPlayerAccData(addr);

    playerAccId = id;
    LOGIN.className = 'off';

    if (!data) {
        SIGN_UP.className = '';
        return;
    }

    loadAccount(id, data);
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

    const [playerAccId, data] = await getPlayerAccData(playerId.toBase58());

    if (!data) {
        const msg = 'Error creating account. Try again after some time';
        alert(msg);
        throw msg;
    }

    loadAccount(playerAccId, data);
    SIGN_UP.className = 'off';
    MAIN.className = '';
};

CHALLENGE.onclick = () => {
    if (!chosenOpponent) return;
    sendGameInvite(playerId, playerAccId, chosenOpponent);
};

// Functions ***********************************************


function loadAccount(accId, data) {
    loadProfile(accId, data);
    loadOpponents(accId);
    init();
}

function init() {
    [you, opponent] = Math.round(Math.random()) ? [0, 1] : [1, 0];

    GAME_BOXES.forEach((arr, row) => {
        arr.forEach((box, col) => {
            box.onclick = () => play(row, col, true);
        });
    });
}

function play(row, col, self) {
    if (!isNaN(GAME[row][col])) return;
    
    const player = self ? you : opponent;
    GAME[row][col] = player;
    GAME_BOXES[row][col].appendChild(IMAGES[player].cloneNode());

    // Evaluate game
    let rowSum = 0;
    let colSum = 0;

    for (let i = 0; i < 3; ++i) {
        rowSum += GAME[row][i];
        colSum += GAME[i][col];
    }

    if (rowSum === player * 3) {
        alert(self ? 'You won!' : 'You lost.');
        return;
    }
    
    if (colSum === player * 3) {
        alert(self ? 'You won!' : 'You lost.');
        return;
    }

    // Diagonal sum
    let d1Sum = 0;
    let d2Sum = 0;

    for (let i = 0; i < 3; ++i) {
        d1Sum += GAME[i][i];
        d2Sum += GAME[2 - i][i];
    }

    if (d1Sum === player * 3) {
        alert(self ? 'You won!' : 'You lost.');
        return;
    }
    
    if (d2Sum === player * 3) {
        alert(self ? 'You won!' : 'You lost.');
        return;
    }
}

function clearGame() {
    GAME.length = 0;

    GAME_BOXES.forEach(arr => {
        GAME.push(Array(3).fill(NaN));
        arr.forEach(box => box.innerHTML = '');
    });
}

function loadImages(paths) {
    return new Promise(resolve => {
        let count = 0;
        const images = paths.map(path => {
            const img = new Image();
            img.src = path;
            return img;
        });
        
        for (const img of images) {
            img.onload = () => (++count === 2) && resolve(images);
        }
    });
}

function loadPlayer(id, name) {
    chosenOpponent = id;
    OPPONENT_NAME.textContent = name;
    OPPONENT_ID.textContent = id.toBase58();
    OPPONENT_DATA.className = '';
}

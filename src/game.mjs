import { PLAYER } from './userProfile.mjs';
import { closeOpponentProfile } from './opponentProfile.mjs';
import { getAccDataWithAccAddress, monitorAccount, unMonitorAccount,
    isSameKey, makeAMove, closeGameAccount } from './chain.mjs';

const GAME_PANEL = document.getElementById('gamePanel');
const PLAYER1_NAME = document.getElementById('player1Name');
const PLAYER2_NAME = document.getElementById('player2Name');
const TURN_SIGNAL = document.getElementById('turnSignal');
const GAME_BOARD = document.getElementById('gameTable');
const GAME_RESULT = document.getElementById('gameResult');
const GAME_BOXES = Array.from(GAME_BOARD.getElementsByTagName('tr')).map(tr => Array.from(tr.getElementsByTagName('td')));
const IMAGES = await loadImages(['res/cross.svg', 'res/circle.svg']);
const GAME = Array(3).fill(true).map(() => Array(3).fill(NaN));

let gameSubScriptionId = null;
let opponentAccId = null;
let gameAcc = null;
let noOfMoves = 0;

let yourTurn;
let idxYou;
let idxOpponent;


GAME_BOXES.forEach((arr, row) => arr.forEach((box, col) => {
    box.onclick = () => {
        if (!yourTurn || !gameAcc) return;
        play(row, col) ? makeAMove(col + row * 3, gameAcc) : alert('Invalid move!');
    };
}));

document.getElementById('closeGameBtn').onclick = async () => {
    if (gameAcc) {
        await closeGameAccount(gameAcc, opponentAccId);
        clearGame();
    }    
};


export async function initGame(gameId) {
    closeOpponentProfile();

    const playerAccId_bytes = PLAYER.playerAccId.toBytes();
    const data = await getAccDataWithAccAddress(gameId);
    if (!data) return;
    
    gameSubScriptionId = monitorAccount(gameId, accInfo => updateGame(accInfo.data));
    gameAcc = gameId;

    if (isSameKey(data.subarray(0, 32), playerAccId_bytes)) {
        opponentAccId = new solanaWeb3.PublicKey(data.subarray(32, 64));        
        const opponentData = await getAccDataWithAccAddress(opponentAccId);
        
        yourTurn = true;
        idxYou = 0;
        idxOpponent = 1;
        PLAYER1_NAME.textContent = 'You';
        PLAYER2_NAME.textContent = new TextDecoder().decode(opponentData.subarray(0, 20)).trim();
    } else if (isSameKey(data.subarray(32, 64), playerAccId_bytes)) {
        opponentAccId = new solanaWeb3.PublicKey(data.subarray(0, 32));        
        const opponentData = await getAccDataWithAccAddress(opponentAccId);
        
        yourTurn = false;
        idxYou = 1;
        idxOpponent = 0;
        PLAYER1_NAME.textContent = new TextDecoder().decode(opponentData.subarray(0, 20)).trim();
        PLAYER2_NAME.textContent = 'You';
    } else {
        const msg = 'Internal error';
        alert(msg);
        throw msg;
    }

    updateGame(data);
    GAME_PANEL.className = '';
}

function updateGame(data) {
    const moves = data[64];
    const status = data[65];

    for (let i = noOfMoves; i < moves; ++i) {
        const boxIdx = data[66 + i];
        const row = Math.floor(boxIdx / 3);
        const col = boxIdx % 3;
        play(row, col);
    }

    noOfMoves = moves;
    status ? endGame(status) : (yourTurn ? signalYourTurn() : signalOpponentTurn());
}

function play(row, col) {
    if (gameSubScriptionId === null || !isNaN(GAME[row][col])) return false;
    
    if (yourTurn) {
        GAME[row][col] = 0;
        GAME_BOXES[row][col].appendChild(IMAGES[idxYou].cloneNode());
    } else {
        GAME[row][col] = 1;
        GAME_BOXES[row][col].appendChild(IMAGES[idxOpponent].cloneNode());
    }

    ++noOfMoves;
    yourTurn = !yourTurn;
    return true;
}

function endGame(status) {
    hideTurnSignals();

    if (status === 9) {
        GAME_RESULT.className = 'draw';
    } else {
        GAME_RESULT.className = (noOfMoves % 2 === idxYou) ? 'opponent' : 'you';
        displayWinningMove(status);
    }

    unMonitorAccount(gameSubScriptionId);
    gameSubScriptionId = null;
}

function clearGame() {
    opponentAccId = null;
    gameAcc = null;
    GAME.length = 0;
    noOfMoves = 0;

    GAME_BOXES.forEach(arr => {
        GAME.push(Array(3).fill(NaN));
        arr.forEach(box => box.innerHTML = '');
    });

    GAME_PANEL.className = 'off';        
    GAME_RESULT.className === 'you' && alert('The bet money has been transfered to your player account.');
    GAME_RESULT.className = '';
}

function signalYourTurn() {
    TURN_SIGNAL.className = 'you';
}

function signalOpponentTurn() {
    TURN_SIGNAL.className = 'opponent';
}

function hideTurnSignals() {
    TURN_SIGNAL.className = '';
}

function displayWinningMove(status) {

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

import { getGameAccount, getAccDataWithAccAddress, monitorAccount,
    unMonitorAccount, isSameKey, makeAMove, closeGameAccount } from './chain.mjs';

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
let yourTurn;
let noOfMoves = 0;

let you; // 0 or 1
let opponent; // 0 or 1


GAME_BOXES.forEach((arr, row) => {
    arr.forEach((box, col) => {
        box.onclick = () => {
            if (!yourTurn || !gameAcc) return;

            if (play(row, col, you)) {
                ++noOfMoves;
                makeAMove(col + row * 3, gameAcc);
                evaluateGame(row, col, you) ? hideTurnSignals() : signalOpponentTurn();                    
            } else {
                alert('Invalid move!');
            }
        };
    });
});

document.getElementById('closeGameBtn').onclick = async () => {
    if (gameAcc) {
        await closeGameAccount(gameAcc, opponentAccId);

        opponentAccId = null;
        clearGame();

        GAME_PANEL.className = 'off';        
        GAME_RESULT.className === 'you' && alert('The bet money has been transfered to your player account.');
        GAME_RESULT.className = '';
    }
};


export async function initGame(opponentId, opponentName) {
    opponentAccId = opponentId;
    gameAcc = getGameAccount(opponentId)[0];
    gameSubScriptionId = monitorAccount(gameAcc, accInfo => updateGame(accInfo.data));

    const data = await getAccDataWithAccAddress(gameAcc);
    if (!data) return;

    if (isSameKey(data.subarray(32, 64), opponentId.toBytes())) {
        you = 0;
        opponent = 1;

        PLAYER1_NAME.textContent = 'You';
        PLAYER2_NAME.textContent = opponentName;
    } else {
        you = 1;
        opponent = 0;

        PLAYER1_NAME.textContent = opponentName;
        PLAYER2_NAME.textContent = 'You';
    }

    data[64] && updateGame(data);
    GAME_PANEL.className = '';
}

function updateGame(data) {
    const status = data[64];

    if (status >= 1) {
        let limit = 9;

        if (status > 9) { while (data[64 + limit] === 0) --limit; }
        else { limit = status; }

        for (let i = noOfMoves; i < limit; ++i) {
            const boxIdx = data[65 + i];
            const row = Math.floor(boxIdx / 3);
            const col = boxIdx % 3;
            const player = (i + 1) % 2 === you ? opponent : you;

            play(row, col, player);

            if (i === limit - 1) {
                if (evaluateGame(row, col, player)) {
                    hideTurnSignals();
                } else {
                    (player === opponent) ? signalYourTurn() : signalOpponentTurn();
                }
            }
        }

        noOfMoves = limit;
    }

    if (status === 10) {
        endGame('draw');
    } else if (status === 11) {
        endGame(isSameKey(opponentAccId.toBytes(), data.subarray(0, 32)) ? 'opponent' : 'you');        
    } else if (status === 12) {
        endGame(isSameKey(opponentAccId.toBytes(), data.subarray(0, 32)) ? 'you' : 'opponent');  
    }
}

function play(row, col, player) {
    if (gameSubScriptionId === null || !isNaN(GAME[row][col])) return false;
    
    GAME[row][col] = player;
    GAME_BOXES[row][col].appendChild(IMAGES[player].cloneNode());
    return true;
}

function evaluateGame(row, col, player) {
    let rowSum = 0;
    let colSum = 0;

    // Diagonal sums
    let d1Sum = 0;
    let d2Sum = 0;

    for (let i = 0; i < 3; ++i) {
        rowSum += GAME[row][i];
        colSum += GAME[i][col];

        d1Sum += GAME[i][i];
        d2Sum += GAME[2 - i][i];
    }

    if (rowSum === player * 3) {
        return true;
    }
    
    if (colSum === player * 3) {
        return true;
    }

    if (d1Sum === player * 3) {
        return true;
    }
    
    if (d2Sum === player * 3) {
        return true;
    }

    return false;
}

function endGame(whoWon) {
    GAME_RESULT.className = whoWon;
    unMonitorAccount(gameSubScriptionId);
    gameSubScriptionId = null;
}

function clearGame() {
    gameAcc = null;
    GAME.length = 0;

    GAME_BOXES.forEach(arr => {
        GAME.push(Array(3).fill(NaN));
        arr.forEach(box => box.innerHTML = '');
    });
}

function signalYourTurn() {
    yourTurn = true;
    TURN_SIGNAL.className = 'you';
}

function signalOpponentTurn() {
    yourTurn = false;
    TURN_SIGNAL.className = 'opponent';
}

function hideTurnSignals() {
    yourTurn = false;
    TURN_SIGNAL.className = '';
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

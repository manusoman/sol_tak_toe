import { getGameAccount, getAccDataWithAccAddress, monitorAccount, unMonitorAccount, isSameKey, makeAMove } from './chain.mjs';

const GAME_PANEL = document.getElementById('gamePanel');
const TURN_SIGNAL = document.getElementById('turnSignal');
const GAME_BOARD = document.getElementById('gameTable');
const GAME_BOXES = Array.from(GAME_BOARD.getElementsByTagName('tr')).map(tr => Array.from(tr.getElementsByTagName('td')));
const IMAGES = await loadImages(['res/cross.svg', 'res/circle.svg']);
const GAME = Array(3).fill(true).map(() => Array(3).fill(NaN));

let gameSubScriptionId = null;
let gameAcc = null;
let yourTurn;
let noOfMoves = 0;

let you; // 0 or 1
let opponent; // 0 or 1


GAME_BOXES.forEach((arr, row) => {
    arr.forEach((box, col) => {
        box.onclick = () => {
            if (yourTurn && gameAcc) {
                ++noOfMoves;
                makeAMove(col + row * 3, gameAcc);
                play(row, col, you);
                evaluateGame(row, col, you);
                hideTurnSignal();
            }
        }
    });
});

export async function initGame(opponentId, opponentName) {
    gameAcc = getGameAccount(opponentId)[0];
    gameSubScriptionId = monitorAccount(gameAcc, accInfo => updateGame(accInfo.data));

    const data = await getAccDataWithAccAddress(gameAcc);
    const firstPlayer = isSameKey(data.subarray(32, 64), opponentId.toBytes());

    if (firstPlayer) {
        you = 0;
        opponent = 1;
        showTurnSignal();
    } else {
        you = 1;
        opponent = 0;
        hideTurnSignal();
    }

    data[64] && updateGame(data);
    GAME_PANEL.className = '';
}

function updateGame(data) {
    const status = data[64];

    console.log('Move detected...');
    console.log(data);

    if (status >= 1) {
        const limit = status > 9 ? 9 : status;

        for (let i = noOfMoves; i < limit; ++i) {
            const boxIdx = data[65 + i];
            const row = Math.floor(boxIdx / 3);
            const col = boxIdx % 3;
            const player = (i + 1) % 2 === you ? opponent : you;

            play(row, col, player);

            (i === limit - 1) &&
            !evaluateGame(row, col, player) &&
            (player === opponent) ?
            showTurnSignal() : hideTurnSignal();
        }

        noOfMoves = limit;
    }
    
    if (status === 10) {

    } else if (status === 11) {

    } else if (status === 12) {

    }
}

function play(row, col, player) {
    if (gameSubScriptionId === null || !isNaN(GAME[row][col])) return;
    
    GAME[row][col] = player;
    GAME_BOXES[row][col].appendChild(IMAGES[player].cloneNode());
}

function evaluateGame(row, col, player) {
    let rowSum = 0;
    let colSum = 0;

    for (let i = 0; i < 3; ++i) {
        rowSum += GAME[row][i];
        colSum += GAME[i][col];
    }

    if (rowSum === player * 3) {
        endGame(player);
        return true;
    }
    
    if (colSum === player * 3) {
        endGame(player);
        return true;
    }

    // Diagonal sum
    let d1Sum = 0;
    let d2Sum = 0;

    for (let i = 0; i < 3; ++i) {
        d1Sum += GAME[i][i];
        d2Sum += GAME[2 - i][i];
    }

    if (d1Sum === player * 3) {
        endGame(player);
        return true;
    }
    
    if (d2Sum === player * 3) {
        endGame(player);
        return true;
    }

    return false;
}

function endGame(player) {
    hideTurnSignal();
    alert(player === you ? 'You won!' : 'You lost.');
    // GAME_PANEL.className = 'off';
    // clearGame();

    unMonitorAccount(gameSubScriptionId);
    gameSubScriptionId = null;
    gameAcc = null;
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

function showTurnSignal() {
    yourTurn = true;
    TURN_SIGNAL.className = 'show';
}

function hideTurnSignal() {
    yourTurn = false;
    TURN_SIGNAL.className = '';
}

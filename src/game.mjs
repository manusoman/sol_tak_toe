import { getGameAccount, getAccDataWithAccAddress, monitorAccount, unMonitorAccount, isSameKey, makeAMove } from './chain.mjs';

const GAME_PANEL = document.getElementById('gamePanel');
const TURN_SIGNAL = document.getElementById('turnSignal');
const GAME_BOARD = document.getElementById('gameTable');
const GAME_BOXES = Array.from(GAME_BOARD.getElementsByTagName('tr')).map(tr => Array.from(tr.getElementsByTagName('td')));
const IMAGES = await loadImages(['res/cross.svg', 'res/circle.svg']);
const GAME = Array(3).fill(true).map(() => Array(3).fill(NaN));

let gameSubScriptionId = null;
let gameAcc = null;
let you; // 0 or 1
let opponent; // 0 or 1


GAME_BOXES.forEach((arr, row) => {
    arr.forEach((box, col) => {
        box.onclick = () => {
            play(row, col, you);
            TURN_SIGNAL.className = '';
            makeAMove(1 + col + row * 3, gameAcc);
        }
    });
});

export async function initGame(opponentId, opponentName) {
    gameAcc = getGameAccount(opponentId)[0];
    gameSubScriptionId = monitorAccount(gameAcc, playOpponent);

    const data = await getAccDataWithAccAddress(gameAcc);
    const opponentFirst = isSameKey(data.subarray(0, 32), opponentId.toBytes());

    if (opponentFirst) {
        you = 1;
        opponent = 0;
    } else {
        you = 0;
        opponent = 1;
        TURN_SIGNAL.className = 'show';
    }

    GAME_PANEL.className = '';
}

function playOpponent(accInfo) {
    const {data} = accInfo;

    console.log('Move detected...');
    console.log(data);
    
    const status = data[64];
    if (status < 1 || status > 9 || status % 2 === you) return;

    const box = data[64 + status] - 1;
    play(Math.floor(box / 3), box % 3, opponent);
}

function play(row, col, player) {
    if (gameSubScriptionId === null || !isNaN(GAME[row][col])) return;
    
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
        return endGame(player);
    }
    
    if (colSum === player * 3) {
        return endGame(player);
    }

    // Diagonal sum
    let d1Sum = 0;
    let d2Sum = 0;

    for (let i = 0; i < 3; ++i) {
        d1Sum += GAME[i][i];
        d2Sum += GAME[2 - i][i];
    }

    if (d1Sum === player * 3) {
        return endGame(player);
    }
    
    if (d2Sum === player * 3) {
        return endGame(player);
    }
}

function endGame(player) {
    unMonitorAccount(gameSubScriptionId);

    gameSubScriptionId = null;
    gameAcc = null;

    alert(player === you ? 'You won!' : 'You lost.');
    GAME_PANEL.className = 'off';
    clearGame();
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

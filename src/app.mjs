import { connectWallet } from './wallet.mjs';
import { getPlayerAccData, signUpPlayer } from './chain.mjs';

const DP = document.getElementById('dp');
const PROFILE_PIC_CTX = document.getElementById('profilePic').getContext('2d');
const USERNAME = document.getElementById('username');
const LOGIN = document.getElementById('login');
const SIGN_UP = document.getElementById('signup');
const MAIN = document.getElementById('main');
const GAME_BOARD = document.getElementById('gameTable');
const PLAYER_LIST = document.getElementById('playerList');
const GAME_BOXES = Array.from(GAME_BOARD.getElementsByTagName('tr')).map(tr => Array.from(tr.getElementsByTagName('td')));
const IMAGES = await loadImages(['res/circle.svg', 'res/cross.svg']);
const GAME = Array(3).fill(true).map(() => Array(3).fill(NaN));

export let wallet;
let you; // 0 or 1
let opponent; // 0 or 1



// Event Listeners *****************************************

document.getElementById('walletConnectButton').onclick = async () => {
    wallet = connectWallet();
    const addr = wallet.publicKey.toBase58();
    const [id, data] = await getPlayerAccData(addr);

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
        await signUpPlayer(wallet, name);
    } catch (err) {
        alert('Error creating account. Try again after some time');
        throw err;
    }
    
    alert('Your account has been created! Enjoy gaming.');

    const addr = wallet.publicKey.toBase58();
    const [id, data] = await getPlayerAccData(addr);

    if (!data) {
        alert('Error creating account. Try again after some time');
        return;
    }

    loadAccount(id, data);
    SIGN_UP.className = 'off';
    MAIN.className = '';
};

// Functions ***********************************************

function init() {
    [you, opponent] = Math.round(Math.random()) ? [0, 1] : [1, 0];

    GAME_BOXES.forEach((arr, row) => {
        arr.forEach((box, col) => {
            box.onclick = () => play(row, col, true);
        });
    });
}

function loadAccount(id, data) {
    putProfilePic(id);
    putName(data.slice(0, 20));

    DP.className = '';
    MAIN.className = '';
    
    console.log(`User connected: ${id.toBase58()}`);

    init();
    fillPlayers();
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

function fillPlayers() {
    let count = 12;

    while (count--) {
        const li = document.createElement('li');
        li.textContent = getRandomUsername();
        PLAYER_LIST.appendChild(li);
    }
}

function putName(data) {
    const name = new TextDecoder().decode(data);
    USERNAME.textContent = name.trim();
}

function putProfilePic(accID) {
    const bytes = accID.toBytes();
    const map = [...bytes, ...bytes.subarray(0, 16)];
    const blockSize = 7;
    const blockCount = 4;
    const dataSize = 4 * blockSize ** 2;
    const { floor } = Math;

    for (let idx = 0, bi = 0; bi < blockCount ** 2; idx += 3, ++bi) {
        const data = new Uint8ClampedArray(dataSize);
        const color = [map[idx], map[idx + 1], map[idx + 2], 255];

        for (let i = 0; i < dataSize; i += 4) {
            data.set(color, i);
        }

        PROFILE_PIC_CTX.putImageData(
            new ImageData(data, blockSize),
            (bi % blockCount) * blockSize,
            floor(bi / blockCount) * blockSize
        );
    }
}

function getRandomUsername() {
    const { floor, round, random } = Math;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789';
    const numChars = chars.length;
    let len = round(random() * 6) + 4;
    let name = '';

    while (len--) {
        name += chars[floor(random() * numChars)];
    }

    return name;
}

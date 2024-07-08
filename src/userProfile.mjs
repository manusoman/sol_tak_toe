import { putProfilePic } from './imgGenerator.mjs';
import { PLAYER_ACC_RENT_EXEMPTION, closePlayerAccount } from './chain.mjs';

const DP = document.getElementById('dp');
const PROFILE_PIC = document.getElementById('profilePic');
const USERNAME = document.getElementById('username');

const PROFILE_DATA = document.getElementById('profileData');
const USER_ID = document.getElementById('userId');
const CLOSE_ACC_BTN = document.getElementById('closeAccBtn');
const DISCONNECT_BTN = document.getElementById('disconnectBtn');

export const PLAYER = {};


DP.onclick = () => {
    PROFILE_DATA.className = '';
};

PROFILE_DATA.onclick = e => {
    if (e.target === PROFILE_DATA) {
        PROFILE_DATA.className = 'off';
    }
};

CLOSE_ACC_BTN.onclick = async () => {
    try {
        let res = await closePlayerAccount();
        console.log(res);
        PROFILE_DATA.className = 'off';
        alert('Your account has been closed');
    } catch (err) {
        console.error(err);
    }
};


export function loadProfile(pId, accId, seed, data, lamports) {
    const idStr = accId.toBase58();

    PLAYER.playerId = pId;
    PLAYER.playerAccId = accId;
    PLAYER.bumpSeed = seed;

    updateBalance(lamports);
    putNameAndPicture(data.slice(0, 20), accId);
    DP.className = '';
    USER_ID.textContent = idStr;
}

function putNameAndPicture(data, accID) {
    const name = new TextDecoder().decode(data);

    USERNAME.textContent = name.trim();
    putProfilePic(accID.toBytes(), PROFILE_PIC);
}

export function updateBalance(lamports) {
    PLAYER.balance = lamports - PLAYER_ACC_RENT_EXEMPTION;
}

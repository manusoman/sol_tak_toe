import { putProfilePic } from './imgGenerator.mjs';

const DP = document.getElementById('dp');
const PROFILE_PIC = document.getElementById('profilePic');
const USERNAME = document.getElementById('username');

const PROFILE_DATA = document.getElementById('profileData');
const USER_ID = document.getElementById('userId');
const CLOSE_ACC_BTN = document.getElementById('closeAccBtn');
const DISCONNECT_BTN = document.getElementById('disconnectBtn');


DP.onclick = () => {
    PROFILE_DATA.className = '';
};

PROFILE_DATA.onclick = e => {
    if (e.target === PROFILE_DATA) {
        PROFILE_DATA.className = 'off';
    }
};


export function loadProfile(accId, data) {
    const idStr = accId.toBase58();

    putNameAndPicture(data.slice(0, 20), accId);
    DP.className = '';
    USER_ID.textContent = idStr;
    console.log(`User connected: ${idStr}`);
}

function putNameAndPicture(data, accID) {
    const name = new TextDecoder().decode(data);

    USERNAME.textContent = name.trim();
    putProfilePic(accID.toBytes(), PROFILE_PIC);
}

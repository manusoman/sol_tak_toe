import { putProfilePic } from './imgGenerator.mjs';
import { PLAYER_ACC_RENT_EXEMPTION, getAccDataWithAccAddress, closePlayerAccount, monitorAccount } from './chain.mjs';
import { populateChallenges, clearChallenges } from './challengePanel.mjs';
import { closeOpponentProfile } from './opponentProfile.mjs';
import { initGame } from './game.mjs';

const DP = document.getElementById('dp');
const PROFILE_PIC = document.getElementById('profilePic');
const USERNAME = document.getElementById('username');

const PROFILE_DATA = document.getElementById('profileData');
const USER_ID = document.getElementById('userId');
const CLOSE_ACC_BTN = document.getElementById('closeAccBtn');

export const PLAYER = {};
let currentInviteCount = 0;


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


export function updateBalance(lamports) {
    PLAYER.balance = lamports - PLAYER_ACC_RENT_EXEMPTION;
}

export function loadProfile(pId, accId, seed, data, lamports) {
    const idStr = accId.toBase58();

    PLAYER.playerId = pId;
    PLAYER.playerAccId = accId;
    PLAYER.bumpSeed = seed;

    updateBalance(lamports);
    putNameAndPicture(data.slice(0, 20), accId);
    DP.className = '';
    USER_ID.textContent = idStr;

    monitorAccount(accId, accInfo => {
        updateBalance(accInfo.lamports);
        trackChanges(accInfo.data);
    });

    trackChanges(data);
}

async function trackChanges(data) {
    if (data[20]) {
        populateChallenges();
    } else {
        clearChallenges();
    }
}

function trackChanges_old(data) {
    const opponentId = new solanaWeb3.PublicKey(data.subarray(22));

    switch (data[20]) {
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

function putNameAndPicture(data, accID) {
    const name = new TextDecoder().decode(data);

    USERNAME.textContent = name.trim();
    putProfilePic(accID.toBytes(), PROFILE_PIC);
}

async function getPlayerName(accId) {
    const accData = await getAccDataWithAccAddress(accId);
    const name = new TextDecoder().decode(accData.slice(0, 20));
    return name.trim();
}

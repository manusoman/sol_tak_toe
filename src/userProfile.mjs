import { putProfilePic } from './imgGenerator.mjs';
import { PLAYER_ACC_RENT_EXEMPTION, closePlayerAccount,
    monitorAccount, withdrawBalance, lamportsToSols } from './chain.mjs';
import { populateChallenges, clearChallenges, showChallengePanel } from './challengePanel.mjs';
import { initGame } from './game.mjs';

const DP = document.getElementById('dp');
const SOL_BALANCE = document.getElementById('solBalance');
const DP_BTN = document.getElementById('dpBtn');
const PROFILE_PIC = document.getElementById('profilePic');
const USERNAME = document.getElementById('username');

const PROFILE_DATA = document.getElementById('profileData');
const USER_ID = document.getElementById('userId');
const WITHDRAW_BALANCE_BTN = document.getElementById('withDrawBlnc');
const CLOSE_ACC_BTN = document.getElementById('closeAccBtn');

export const PLAYER = {};
let ongoingGame = false;


DP_BTN.onclick = () => PROFILE_DATA.className = '';

PROFILE_DATA.onclick = e => {
    if (e.target === PROFILE_DATA) {
        PROFILE_DATA.className = 'off';
    }
};

WITHDRAW_BALANCE_BTN.onclick = () => {
    withdrawBalance().then(() => {
        alert('Balance has been withdrawn');
        PROFILE_DATA.className = 'off';
    }).catch(console.error);
};

CLOSE_ACC_BTN.onclick = () => {
    closePlayerAccount().then(() => {
        console.log(res);
        PROFILE_DATA.className = 'off';
        alert('Your account has been closed');
    }).catch(console.error);
};


export function updateBalance(lamports) {
    SOL_BALANCE.textContent = lamportsToSols(lamports);
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
    
    showChallengePanel();
    trackChanges(data);
}

function trackChanges(data) {
    const temp = data.subarray(21);

    if (!ongoingGame) {
        for (let i = 0; i < 32; ++i) {
            if (temp[i]) {
                ongoingGame = true;

                initGame(new solanaWeb3.PublicKey(temp))
                .then(() => {
                    ongoingGame = false;
                    showChallengePanel();
                });
                
                return;
            }
        }
    }

    data[20] ? populateChallenges() : clearChallenges();
}

function putNameAndPicture(data, accID) {
    const name = new TextDecoder().decode(data);

    USERNAME.textContent = name.trim();
    putProfilePic(accID.toBytes(), PROFILE_PIC);
}

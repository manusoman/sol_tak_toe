import { acceptGameInvite } from './chain.mjs';

const GAME_INVITE_DATA = document.getElementById('gameInviteData');
const CHALLENGER_NAME = document.getElementById('challengerName');
const CHALLENGER_ID = document.getElementById('challengerAccId');
let opponentId;

document.getElementById('acceptChallengeButton').onclick = () => {
    acceptGameInvite(opponentId)
    .then(console.log)
    .catch(console.error);
};

document.getElementById('closeChallengeButton').onclick = closeChallengePanel;


export function loadChallengePanel(id, name) {
    opponentId = id;
    CHALLENGER_NAME.textContent = name;
    CHALLENGER_ID.textContent = id.toBase58();
    GAME_INVITE_DATA.className = '';
}

export function closeChallengePanel() {
    GAME_INVITE_DATA.className = 'off';
}

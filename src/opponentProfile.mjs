import { sendGameInvite } from './chain.mjs';

const OPPONENT_DATA = document.getElementById('opponentData');
const OPPONENT_NAME = document.getElementById('opponentName');
const OPPONENT_ID = document.getElementById('opponentAccId');
let chosenOpponent;


document.getElementById('challengeButton').onclick = () => {
    if (!chosenOpponent) return;
    sendGameInvite(chosenOpponent);
};


export function loadOpponentProfile(id, name) {
    chosenOpponent = id;
    OPPONENT_NAME.textContent = name;
    OPPONENT_ID.textContent = id.toBase58();
    OPPONENT_DATA.className = '';
}

export function closeOpponentProfile() {
    chosenOpponent = undefined;
    OPPONENT_DATA.className = 'off';
}

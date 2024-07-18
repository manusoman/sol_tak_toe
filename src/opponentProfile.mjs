import { showChallengePanel, closeChallengePanel } from './challengePanel.mjs';
import { sendGameInvite } from './chain.mjs';

const OPPONENT_DATA = document.getElementById('opponentData');
const OPPONENT_NAME = document.getElementById('opponentName');
const OPPONENT_ID = document.getElementById('opponentAccId');
let chosenOpponent;


OPPONENT_DATA.onsubmit = async e => {
    e.preventDefault();    
    if (!chosenOpponent) return;

    const stakeIdx = parseInt(OPPONENT_DATA.stakeIdx.value);
    await sendGameInvite(chosenOpponent, stakeIdx);

    closeOpponentProfile();
    showChallengePanel();
};


export function loadOpponentProfile(id, name) {
    chosenOpponent = id;
    OPPONENT_NAME.textContent = name;
    OPPONENT_ID.textContent = id.toBase58();

    closeChallengePanel();
    OPPONENT_DATA.className = '';
}

export function closeOpponentProfile() {
    chosenOpponent = undefined;
    OPPONENT_DATA.className = 'off';
}

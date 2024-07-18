import { getChallenges, acceptGameInvite, lamportsToSols } from './chain.mjs';
import { putProfilePic } from './imgGenerator.mjs';

const GAME_INVITE_DATA = document.getElementById('gameInviteData');
const CHALLENGE_LIST = document.getElementById('challengeList');


export async function populateChallenges() {
    const challenges = await getChallenges();

    for (const child of CHALLENGE_LIST.children) {
        CHALLENGE_LIST.removeChild(child);
    }

    for (const {challengeId, name, opponent, stake, timestamp} of challenges) {
        const li = document.createElement('li');
        const img = new Image();
        const div = document.createElement('div');
        const h3 = document.createElement('h3');
        const span1 = document.createElement('span');
        const span2 = document.createElement('span');
        const button = document.createElement('button');

        putProfilePic(opponent.toBytes(), img);
        h3.textContent = name;
        span1.textContent = opponent.toBase58();
        span2.textContent = timestamp;
        button.textContent = `Accept Challenge [${lamportsToSols(stake)} Sols]`;
        
        button.onclick = () => {
            acceptGameInvite(opponent, challengeId, stake)
            .then(sx => {
                CHALLENGE_LIST.removeChild(li);
                console.log(sx);
            })
            .catch(console.error);
        };

        div.appendChild(h3);
        div.appendChild(span1);
        div.appendChild(span2);

        li.appendChild(img);
        li.appendChild(div);
        li.appendChild(button);

        CHALLENGE_LIST.appendChild(li);
    }
}

export function clearChallenges() {
    CHALLENGE_LIST.innerHTML = '';
}

export function showChallengePanel() {
    GAME_INVITE_DATA.className = '';
}

export function closeChallengePanel() {
    GAME_INVITE_DATA.className = 'off';
}

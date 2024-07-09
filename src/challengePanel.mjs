import { getChallenges, acceptGameInvite } from './chain.mjs';

const GAME_INVITE_DATA = document.getElementById('gameInviteData');
const CHALLENGE_LIST = document.getElementById('challengeList');
const CHALLENGES = new Set();

document.getElementById('acceptChallengeButton').onclick = () => {
    acceptGameInvite(opponentId)
    .then(console.log)
    .catch(console.error);
};


export async function populateChallenges() {
    const challenges = await getChallenges();

    for (const {challengeId, name, opponent, timestamp} of challenges) {
        const key = challengeId.toBase58();

        if (CHALLENGES.has(key)) continue;

        CHALLENGES.add(key);

        const li = document.createElement('li');
        const img = new Image();
        const div = document.createElement('div');
        const h3 = document.createElement('h3');
        const span1 = document.createElement('span');
        const span2 = document.createElement('span');
        const button = document.createElement('button');

        h3.textContent = name;
        span1.textContent = opponent.toBase58();
        span2.textContent = timestamp;

        button.onclick = () => {
            acceptGameInvite(challengeId)
            .then(sx => {
                CHALLENGES.delete(key);
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
    CHALLENGES.clear();
}

export function closeChallengePanel() {
    GAME_INVITE_DATA.className = 'off';
}

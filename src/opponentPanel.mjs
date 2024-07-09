import { getPlayers, isSameKey } from './chain.mjs';
import { putProfilePic } from './imgGenerator.mjs';
import { loadOpponentProfile } from './opponentProfile.mjs';

const OPPONENT_LIST = document.getElementById('opponentList');

export async function loadOpponents(playerAccId) {
    const players = await getPlayers();
    const myId = playerAccId.toBytes();
    let shouldCompare = true;

    for (const {id, name} of players) {
        const bytes = id.toBytes();

        if (shouldCompare && isSameKey(myId, bytes)) {
            shouldCompare = false;
            continue;
        }

        const li = document.createElement('li');
        const span = document.createElement('span');
        const img = new Image();

        putProfilePic(bytes, img);
        img.className = 'dpPic';
        span.textContent = name;

        li.onclick = () => loadOpponentProfile(id, name);

        li.appendChild(img);
        li.appendChild(span);
        OPPONENT_LIST.appendChild(li);
    }
}

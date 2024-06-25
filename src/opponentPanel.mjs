import { getOnlinePlayers } from './chain.mjs';
import { putProfilePic } from './imgGenerator.mjs';

const OPPONENT_LIST = document.getElementById('opponentList');

export async function loadOpponents(playerAccId) {
    const players = await getOnlinePlayers();
    const myId = playerAccId.toBytes();
    let shouldCompare = true;

    for (const {id, name} of players) {
        const bytes = id.toBytes();

        if (shouldCompare && isSameKey(myId, bytes)) {
            shouldCompare = false;
            continue;
        }

        const li = document.createElement('li');
        const img = new Image();
        const span = document.createElement('span');

        putProfilePic(bytes, img);
        img.className = 'dpPic';
        span.textContent = name;

        // li.onclick = () => !onGoingGame && loadPlayer(id, name);

        li.appendChild(img);
        li.appendChild(span);
        OPPONENT_LIST.appendChild(li);
    }
}

function isSameKey(key1, key2) {
    for (let i = 0; i < 32; ++i) {
        if (key1[i] !== key2[i]) return false;
    }

    return true;
}

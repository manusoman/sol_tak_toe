const wss = 'wss://solana-devnet.g.alchemy.com/v2/t6gSRDGAMPhZKHCKujDuPU9oq9ob2yWO';
const subscriptions = new Map();

let key = 1;
let WS;

export function subscribe(acc) {
    const rpcData = {
        jsonrpc: "2.0",
        id: key,
        method: "accountSubscribe",
        params: [
            acc.toBase58(),
            { encoding: "jsonParsed", commitment: "finalized" }
        ]
    };

    subscriptions.set(key, rpcData);
    WS.send(JSON.stringify(rpcData));
    return key++;
}

export function unSubscribe(itemKey) {
    const rpcData = {
        jsonrpc: "2.0",
        id: itemKey,
        method: "accountUnsubscribe",
        params: [0]
    };

    subscriptions.delete(itemKey);
    WS.send(JSON.stringify(rpcData));
}

export function init(messageHandler) {
    WS = new WebSocket(wss);
    WS.onerror = () => init(messageHandler);

    WS.onopen = () => {
        subscriptions.forEach(item => WS.send(JSON.stringify(item)));
    };

    WS.onmessage = messageHandler;
}

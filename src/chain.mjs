import {program, user, player1, player2} from './keys.mjs';

// const https = 'https://solana-devnet.g.alchemy.com/v2/t6gSRDGAMPhZKHCKujDuPU9oq9ob2yWO';

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
const programId = program.publicKey;
const programWallet = new solanaWeb3.PublicKey('J7VSmH7DpiNT7xMR77LnNVkBhkVwvS4h68o3k75FpNKq');

let playerAcc = null;

// console.log(player1.publicKey.toBase58())

// initAccount(player1);

// console.log(await signUpPlayer(player2));
// console.log(await sendGameInvite(player1, player2.publicKey));
// console.log(await closePlayerAccount(player1));

function initAccount(player) {
    playerAcc = getPlayerAccount(player.publicKey)[0];
}

export function test(accId, func) {
    return connection.onAccountChange(accId, func, 'finalized');
}


export async function signUpPlayer(playerId, name) {
    const pda = getPlayerAccount(playerId)[0];

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([0, ...new TextEncoder().encode(name)]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: true, pubkey: pda},
            {isSigner: false, isWritable: false, pubkey: solanaWeb3.SystemProgram.programId}
        ],
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    tx.feePayer = playerId;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return window.solana.signAndSendTransaction(tx, {preflightCommitment: 'finalized'});
}


async function closePlayerAccount(player) {
    const [pda, _] = solanaWeb3.PublicKey.findProgramAddressSync(
        [player.publicKey.toBytes(), new TextEncoder().encode('player')],
        programId
    );

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([6]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: player.publicKey},
            {isSigner: false, isWritable: true, pubkey: pda}
        ],
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    return solanaWeb3.sendAndConfirmTransaction(connection, tx, [player]);
}


export async function sendGameInvite(playerId, playerAcc, opponentAcc) {
    console.log('Sending game invite...');
    console.log('player: ', playerAcc.toBase58());
    console.log('opponent: ', opponentAcc.toBase58());

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([3]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: true, pubkey: playerAcc},
            {isSigner: false, isWritable: true, pubkey: opponentAcc}
        ],
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    tx.feePayer = playerId;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return window.solana.signAndSendTransaction(tx, {preflightCommitment: 'finalized'});
}


function answerGameInvite(opponentAcc, answer, player) {
    const wallet = player.publicKey;
    const gameAcc = getGameAccount(playerAcc, opponentAcc)[0];

    const keyList = [
        {isSigner: true, isWritable: false, pubkey: player.publicKey},
        {isSigner: false, isWritable: true, pubkey: playerAcc},
        {isSigner: false, isWritable: true, pubkey: opponentAcc},
        {isSigner: true, isWritable: false, pubkey: programWallet},
        {isSigner: true, isWritable: false, pubkey: gameAcc}
    ];

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([4, answer]),
        keys: answer ? keyList : keyList.slice(0, 3),
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    return solanaWeb3.sendAndConfirmTransaction(connection, tx, [player]);
}


// Utility functions ****************************************

export async function getPlayerAccData(walletAddr) {
    const publicKey = new solanaWeb3.PublicKey(walletAddr);
    const playerAcc = getPlayerAccount(publicKey)[0];
    const res = await connection.getAccountInfo(playerAcc);
    return [playerAcc, res?.data];
}

function getPlayerAccount(pubkey) {
    return solanaWeb3.PublicKey.findProgramAddressSync(
        [pubkey.toBytes(), new TextEncoder().encode('player')],
        programId
    );
}

function getGameAccount(playerAcc, opponentAcc) {
    const seeds = getGameAccountSeeds(playerAcc, opponentAcc);

    return solanaWeb3.PublicKey.findProgramAddressSync(
        [...seeds, new TextEncoder().encode('game')],
        programId
    );
}

function getGameAccountSeeds(acc1, acc2) {
    const seed1 = acc1.toBytes();
    const seed2 = acc2.toBytes();

    for (let i = 0; i < 32; ++i) {
        if (seed1[i] < seed2[i]) {
            return [seed1, seed2];
        }
        if (seed1[i] > seed2[i]) {
            return [seed2, seed1];
        }
    }

    throw 'Both wallets are the same';
}

function transferSol(dest, sols) {
    const ix = solanaWeb3.SystemProgram.transfer({
        fromPubkey: user.publicKey,
        lamports: sols * 10 ** 9,
        toPubkey: dest
    });
    const tx = new solanaWeb3.Transaction().add(ix);
    return solanaWeb3.sendAndConfirmTransaction(connection, tx, [user], 'finalized');
}

function addSol(programId, sols) {
    return connection.requestAirdrop(programId, sols * 10 ** 9);
}

export async function getOnlinePlayers() {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: 'finalized',
        filters: [{
            memcmp: {
                bytes: Base58.encode(new Uint8Array([1])),
                offset: 20
            }
        }]
    });

    const decoder = new TextDecoder();

    return accounts.map(acc => ({
        name: decoder.decode(acc.account.data.subarray(0, 20)),
        id: acc.pubkey
    }));
}

import { program } from './keys.mjs';
import { PLAYER } from './userProfile.mjs';

// const https = 'https://solana-devnet.g.alchemy.com/v2/t6gSRDGAMPhZKHCKujDuPU9oq9ob2yWO';
// const https = 'https://devnet.helius-rpc.com/?api-key=b6223d6d-e75e-4845-9e51-d6e463469026';

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
const programId = program.publicKey;
const PLAYER_ACC_SIZE = 54;
const CHALLENGE_FEE = 5e8; // 0.5 Sols


export const PLAYER_ACC_RENT_EXEMPTION = await connection.getMinimumBalanceForRentExemption(PLAYER_ACC_SIZE);

export function monitorAccount(accId, func) {
    return connection.onAccountChange(accId, func, 'finalized');
}

export function unMonitorAccount(subscription) {
    return connection.removeAccountChangeListener(subscription);
}


export async function signUpPlayer(playerId, name) {
    const pda = getPlayerAccount(playerId)[0];
    console.log('Creating acc:', pda.toBase58());

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
    return signAndSend(tx, playerId);
}


export async function closePlayerAccount() {
    const { playerId, playerAccId } = PLAYER;

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([8]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: true, pubkey: playerAccId}
        ],
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    return signAndSend(tx, playerId);
}


export async function sendGameInvite(opponentAcc) {
    const { playerId, playerAccId, balance } = PLAYER;
    const tx = new solanaWeb3.Transaction();
    
    console.log('Sending game invite...');
    console.log('player: ', playerAccId.toBase58());
    console.log('opponent: ', opponentAcc.toBase58());

    if (balance < CHALLENGE_FEE) {
        tx.add(solanaWeb3.SystemProgram.transfer({
            fromPubkey: playerId,
            lamports: CHALLENGE_FEE - balance,
            toPubkey: playerAccId
        }));

        console.log(`Transfering ${CHALLENGE_FEE - balance} lamports to your account`);
    }
    
    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([3]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: true, pubkey: playerAccId},
            {isSigner: false, isWritable: true, pubkey: opponentAcc}
        ],
        programId
    });

    return signAndSend(tx.add(ix), playerId);
}


export async function acceptGameInvite(opponentAcc) {
    const { playerId, playerAccId, balance } = PLAYER;
    const gameAcc = getGameAccount(opponentAcc)[0];
    const tx = new solanaWeb3.Transaction();

    if (balance < CHALLENGE_FEE) {
        tx.add(solanaWeb3.SystemProgram.transfer({
            fromPubkey: playerId,
            lamports: CHALLENGE_FEE - balance,
            toPubkey: playerAccId
        }));

        console.log(`Transfering ${CHALLENGE_FEE - balance} lamports to your account`);
    }

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([4]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: true, pubkey: playerAccId},
            {isSigner: false, isWritable: true, pubkey: opponentAcc},
            {isSigner: false, isWritable: true, pubkey: gameAcc},
            {isSigner: false, isWritable: false, pubkey: solanaWeb3.SystemProgram.programId}
        ],
        programId
    });

    return signAndSend(tx.add(ix), playerId);
}


export async function makeAMove(boxIdx, gameAcc) {
    const { playerId, playerAccId } = PLAYER;

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([5, boxIdx]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: false, pubkey: playerAccId},
            {isSigner: false, isWritable: true, pubkey: gameAcc}
        ],
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    return signAndSend(tx, playerId);
}


export async function closeGameAccount(gameAcc, opponentAcc) {
    const { playerId, playerAccId } = PLAYER;

    const ix = new solanaWeb3.TransactionInstruction({
        data: new Uint8Array([6]),
        keys: [
            {isSigner: true, isWritable: false, pubkey: playerId},
            {isSigner: false, isWritable: true, pubkey: playerAccId},
            {isSigner: false, isWritable: true, pubkey: gameAcc},
            {isSigner: false, isWritable: true, pubkey: opponentAcc}
        ],
        programId
    });

    const tx = new solanaWeb3.Transaction().add(ix);
    return signAndSend(tx, playerId);
}


// Utility functions ****************************************

export async function getPlayerAccData(walletAddr) {
    const publicKey = new solanaWeb3.PublicKey(walletAddr);
    const [playerAcc, bumpSeed] = getPlayerAccount(publicKey);
    const res = await connection.getAccountInfo(playerAcc, 'finalized');
    return [playerAcc, bumpSeed, res?.data, res?.lamports];
}

export async function getAccDataWithAccAddress(playerAcc) {
    const res = await connection.getAccountInfo(playerAcc);
    return res?.data;
}

export function getGameAccount(opponentAcc) {
    const seeds = getGameAccountSeeds(PLAYER.playerAccId, opponentAcc);

    return solanaWeb3.PublicKey.findProgramAddressSync(
        [...seeds, new TextEncoder().encode('game')],
        programId
    );
}

export function isSameKey(key1, key2) {
    for (let i = 0; i < 32; ++i) {
        if (key1[i] !== key2[i]) return false;
    }

    return true;
}

function getPlayerAccount(pubkey) {
    return solanaWeb3.PublicKey.findProgramAddressSync(
        [pubkey.toBytes(), new TextEncoder().encode('player')],
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


async function signAndSend(tx, payer) {
    tx.feePayer = payer;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signedTx = await window.solana.signTransaction(tx);
    return connection.sendRawTransaction(signedTx.serialize());
}

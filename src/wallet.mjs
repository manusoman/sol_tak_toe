import {player1} from './keys.mjs';

const wallet = (() => {
    if ('phantom' in window) {
        const provider = window.phantom?.solana;
        if (provider?.isPhantom) return provider;

        alert('Phantom wallet is not installed');
    }

    window.open('https://phantom.app/', '_blank');
})();

export const connectWallet = async () => {
    if (!wallet) {
        const msg = 'No wallet found!';
        alert(msg);
        throw msg;
    }

    if (await wallet.connect()) {
        return wallet;
    }
}

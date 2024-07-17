const programKeyData = [
    93,30,15,77,175,26,133,242,80,111,54,116,120,253,57,
    129,209,133,206,50,48,213,80,161,50,189,190,205,212,
    116,18,248,233,245,113,124,254,178,11,50,24,89,141,219,
    125,123,47,84,126,200,230,223,159,2,144,215,94,67,86,246,64,144,184,32
];

const userKeyData = [
    65,  25, 234,  14, 89,  49, 110,  63,  13,  19,  95,
    36, 159,  57, 160, 45, 255,  71, 250, 177,  22, 193,
   152, 143, 244, 194, 37,  29, 150, 250, 245,  24,  11,
   107, 192,  50,  47, 22, 226, 192,  60,  63,  33, 113,
   149,  45, 219,  39, 30, 191,   5,  72, 215, 157, 234,
    60, 153,  77,  41, 21, 106,   7, 195, 216
 ];

const player1KeyData = [
    195,117,241,170,67,239,107,56,170,136,223,38,75,0,122,237,
    224,145,245,218,231,152,81,254,129,98,250,119,108,83,40,
    199,100,241,142,73,253,57,220,218,175,235,226,214,26,248,
    175,189,28,117,118,196,138,3,59,70,237,244,18,6,111,52,9,138
];

const player2KeyData = [
    75,94,160,158,129,11,196,31,147,170,117,101,55,208,75,243,
    33,11,13,39,124,242,129,220,197,175,6,125,117,103,223,155,
    44,111,77,66,189,142,159,10,78,162,176,25,55,217,193,17,32,
    82,233,184,197,28,110,204,121,199,117,252,64,173,55,250
];

const one = '5s7kWgKYT45R8iVgtVg8JPiQHaAa4vquG4LxsDnXfEHmajS73CYXUtuQFGPb9hiHdsTGre7S7CSRMGfHgnAfKwBB';
const two = '4kzisaya1u3GGiebbEpuhsRMHTcVNt8jCCxGhx4B7LF2zTfr11S8n5GMukzQNEFn9aAULUtv91brTMYksJyNTfAL';


export const program = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(programKeyData));
export const user = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(userKeyData));
export const player1 = solanaWeb3.Keypair.fromSecretKey(Base58.decode(one));
export const player2 = solanaWeb3.Keypair.fromSecretKey(Base58.decode(two));

console.log('Program id:', program.publicKey.toBase58());

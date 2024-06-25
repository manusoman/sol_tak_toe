const worker = new Worker('src/worker.mjs');
const images = new Map();
let id = 0;

worker.onmessage = e => {
    const [id, url] = e.data;
    const img = images.get(id);

    if (img) {
        img.src = url;
        images.delete(id);
    }
};

export function putProfilePic(bytes, img) {
    worker.postMessage([id, bytes]);
    images.set(id++, img);
}


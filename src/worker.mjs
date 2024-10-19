const blockSize = 7;
const blockCount = 4;
const size = blockSize * blockCount;
const dataSize = 4 * blockSize ** 2;
const limit = blockCount ** 2;
const { floor } = Math;
const canvas = new OffscreenCanvas(size, size);
const ctx = canvas.getContext('2d');

onmessage = async e => {
    const [id, bytes] = e.data;
    const map = [...bytes, ...bytes.subarray(0, 16)];

    for (let idx = 0, bi = 0; bi < limit; idx += 3, ++bi) {
        const blockData = new Uint8ClampedArray(dataSize);
        const color = [map[idx], map[idx + 1], map[idx + 2], 255];

        for (let i = 0; i < dataSize; i += 4) {
            blockData.set(color, i);
        }

        ctx.putImageData(
            new ImageData(blockData, blockSize),
            (bi % blockCount) * blockSize,
            floor(bi / blockCount) * blockSize
        );
    }

    const blob = await canvas.convertToBlob();
    postMessage([id, URL.createObjectURL(blob)]);
};

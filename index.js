const fs = require('fs');
const Buffer = require('buffer').Buffer;

const CALL_DECODE = [0xE8, 0x27, 0xFF, 0xFF, 0xFF];
const OLD_COMPARE_NUMBER = [0xCE, 0x07, 0x00, 0x00]; // 1998
const NEW_COMPARE_NUMBER = [0xE2, 0x07, 0x00, 0x00]; // 2018

// READ FILE
const dataBuf = fs.readFileSync('4p.exe', { encode: 'hex' });

const indexOfFirstDecodedByte = dataBuf.indexOf(Buffer.from(CALL_DECODE)) + 5;
const numberOfDecodedBytes = dataBuf[indexOfFirstDecodedByte]; // first byte with number of coded bytes
const codedBytes = dataBuf.slice(indexOfFirstDecodedByte + 1, indexOfFirstDecodedByte + 1 + numberOfDecodedBytes);
console.log("Coded bytes:", codedBytes);

// DECODER
const decodedBytes = decoder([...codedBytes]);
console.log("Decoded bytes:", Buffer.from(decodedBytes));

/* REPLACE 1998 to 2018 */
const indexOfComparing = decodedBytes.findIndex((item, i, arr) =>
    item === OLD_COMPARE_NUMBER[0] && arr[i+1] === OLD_COMPARE_NUMBER[1]
);
decodedBytes.splice(indexOfComparing, 4, ...NEW_COMPARE_NUMBER);

// CODER
const newCodedBytes = coder(decodedBytes);

const newCodedBuf = Buffer.from(newCodedBytes);
console.log("New Coded bytes:", newCodedBuf);

// WRITE NEW FILE
const newDataArr = [...dataBuf];
newDataArr.splice(indexOfFirstDecodedByte + 1, numberOfDecodedBytes, ...newCodedBytes);

const newDataBuf = Buffer.from(newDataArr);
fs.writeFileSync('new4p.exe', newDataBuf);

function decoder(codedBytes) {
    const decodedBytes = [];
    const buf = [0x00, 0x00, 0x00, 0x00, 0xA5];
    const last5bytes = codedBytes.splice(codedBytes.length - 5, 5);

    for (const b of codedBytes) {
        const dByte = buf.reduce((acc, it) => {
            return acc - it > 0x00 ? acc - it : acc - it + 0x100;
        }, b);
        decodedBytes.push(dByte);
        buf.shift(); buf.push(b);
    }

    return decodedBytes.concat(last5bytes);
}

function coder(decodedBytes) {
    const codedBytes = [];
    const buf = [0x00, 0x00, 0x00, 0x00, 0xA5];

    const last5bytes = decodedBytes.splice(decodedBytes.length - 5, 5);

    for (const b of decodedBytes) {
        const cByte = buf.reduce((acc, it) => {
            return acc + it < 0xFF ? acc + it : acc + it - 0x100;
        }, b);
        codedBytes.push(cByte);
        buf.shift(); buf.push(cByte);
    }

    return codedBytes.concat(last5bytes);
}

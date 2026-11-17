const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Pure Node.js PNG Encoder
function createPng(width, height, getPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      const [r, g, b] = getPixel(x, y, width, height);
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 1. OG Image Loto FDJ (Bleu / Rouge FDJ)
function generateLotoOg() {
  const width = 1200;
  const height = 630;

  // 5 Boules Bleues (r=45) + 1 Boule Rouge Chance (r=48)
  const balls = [
    { x: 300, y: 360, r: 42, color: [2, 132, 199] },   // Sky 600
    { x: 420, y: 360, r: 42, color: [2, 132, 199] },
    { x: 540, y: 360, r: 42, color: [2, 132, 199] },
    { x: 660, y: 360, r: 42, color: [2, 132, 199] },
    { x: 780, y: 360, r: 42, color: [2, 132, 199] },
    { x: 920, y: 360, r: 46, color: [225, 29, 72] },   // Rose 600 (Numéro Chance)
  ];

  return createPng(width, height, (x, y) => {
    // Fond dégradé sombre élégant (bleu nuit profond à slate foncé)
    const tY = y / height;
    let r = Math.round(15 + tY * 10);
    let g = Math.round(23 + tY * 15);
    let b = Math.round(42 + tY * 20);

    // Halo subtil au centre
    const distCenter = Math.hypot(x - 600, y - 360);
    if (distCenter < 450) {
      const glow = (1 - distCenter / 450) * 0.25;
      r = Math.min(255, Math.round(r + glow * 10));
      g = Math.min(255, Math.round(g + glow * 50));
      b = Math.min(255, Math.round(b + glow * 120));
    }

    // Séparateur '+' entre les 5 numéros et le numéro chance
    if (Math.abs(x - 850) < 3 && Math.abs(y - 360) < 14) {
      return [148, 163, 184];
    }
    if (Math.abs(x - 850) < 14 && Math.abs(y - 360) < 3) {
      return [148, 163, 184];
    }

    // Dessin des boules
    for (const ball of balls) {
      const d = Math.hypot(x - ball.x, y - ball.y);
      if (d <= ball.r) {
        // Ombrage radial 3D
        const lightD = Math.hypot(x - (ball.x - 12), y - (ball.y - 12));
        const factor = Math.max(0, 1 - lightD / (ball.r * 1.3));
        const br = Math.min(255, Math.round(ball.color[0] + factor * 70));
        const bg = Math.min(255, Math.round(ball.color[1] + factor * 70));
        const bb = Math.min(255, Math.round(ball.color[2] + factor * 70));
        return [br, bg, bb];
      }
      // Ombre portée subtile
      if (d <= ball.r + 6) {
        return [Math.round(r * 0.7), Math.round(g * 0.7), Math.round(b * 0.7)];
      }
    }

    return [r, g, b];
  });
}

// 2. OG Image Générale (Loto & EuroMillions)
function generateGeneralOg() {
  const width = 1200;
  const height = 630;

  const balls = [
    { x: 340, y: 360, r: 42, color: [29, 78, 216] },   // Blue 700 (EuroMillions)
    { x: 450, y: 360, r: 42, color: [29, 78, 216] },
    { x: 560, y: 360, r: 42, color: [2, 132, 199] },   // Sky 600 (Loto)
    { x: 670, y: 360, r: 42, color: [2, 132, 199] },
    { x: 780, y: 360, r: 42, color: [16, 185, 129] },  // Emerald 500 (Swiss Lotto)
    { x: 890, y: 360, r: 46, color: [245, 158, 11] },  // Amber 500 (Étoile / Chance)
  ];

  return createPng(width, height, (x, y) => {
    const tY = y / height;
    let r = Math.round(15 + tY * 8);
    let g = Math.round(23 + tY * 12);
    let b = Math.round(42 + tY * 18);

    const distCenter = Math.hypot(x - 600, y - 360);
    if (distCenter < 450) {
      const glow = (1 - distCenter / 450) * 0.22;
      r = Math.min(255, Math.round(r + glow * 20));
      g = Math.min(255, Math.round(g + glow * 40));
      b = Math.min(255, Math.round(b + glow * 90));
    }

    for (const ball of balls) {
      const d = Math.hypot(x - ball.x, y - ball.y);
      if (d <= ball.r) {
        const lightD = Math.hypot(x - (ball.x - 12), y - (ball.y - 12));
        const factor = Math.max(0, 1 - lightD / (ball.r * 1.3));
        const br = Math.min(255, Math.round(ball.color[0] + factor * 70));
        const bg = Math.min(255, Math.round(ball.color[1] + factor * 70));
        const bb = Math.min(255, Math.round(ball.color[2] + factor * 70));
        return [br, bg, bb];
      }
      if (d <= ball.r + 6) {
        return [Math.round(r * 0.7), Math.round(g * 0.7), Math.round(b * 0.7)];
      }
    }

    return [r, g, b];
  });
}

const publicDir = path.resolve(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'og-image.png'), generateGeneralOg());
fs.writeFileSync(path.join(publicDir, 'og-image-loto.png'), generateLotoOg());

console.log('[OG Generator] Generated public/og-image.png and public/og-image-loto.png');

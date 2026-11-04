import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Support both ESM and CJS execution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type LotoDrawType = 'loto' | 'superloto' | 'grandloto';

export interface CompactLotoDraw {
  d: string; // Format ISO: "YYYY-MM-DD"
  n: number[]; // 5 numéros triés (1..49)
  c: number; // Numéro Chance (1..10)
  t: LotoDrawType; // Type de tirage (loto, superloto, grandloto)
  p: number[]; // [r1, r2, r3, r4, r5, r6, r7, r8, r9] montants des gains réels en €
}

export const DEFAULT_LOTO_PAYOUTS: number[] = [
  5000000, // Rang 1: 5 + Chance (Jackpot min 2M€, moy ~5M€)
  100000,  // Rang 2: 5 (100 000 € garanti)
  1000,    // Rang 3: 4 + Chance (~1 000 €)
  500,     // Rang 4: 4 (~500 €)
  50,      // Rang 5: 3 + Chance (~50 €)
  20,      // Rang 6: 3 (~20 €)
  10,      // Rang 7: 2 + Chance (~10 €)
  5,       // Rang 8: 2 (~5 €)
  2.2,     // Rang 9: N° Chance seul (2,20 € remboursement)
];

/**
 * Normalise une chaîne de date hétérogène FDJ en format ISO "YYYY-MM-DD".
 */
export function normalizeDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const str = raw.trim();
  if (!str) return null;

  // Format 1: YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    const date = `${y}-${m}-${d}`;
    return isValidIsoDate(date) ? date : null;
  }

  // Format 2: DD/MM/YYYY ou DD/MM/YY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let [day, month, year] = parts.map((p) => p.trim());
      if (year.length === 2) {
        year = `20${year}`;
      }
      const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      return isValidIsoDate(date) ? date : null;
    }
  }

  // Format 3: YYYY-MM-DD ou DD-MM-YYYY
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts.map((p) => p.trim());
      if (p1.length === 4) {
        const date = `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
        return isValidIsoDate(date) ? date : null;
      }
      if (p3.length === 2 || p3.length === 4) {
        const year = p3.length === 2 ? `20${p3}` : p3;
        const date = `${year}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
        return isValidIsoDate(date) ? date : null;
      }
    }
  }

  return null;
}

function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const timestamp = Date.parse(dateStr);
  return !Number.isNaN(timestamp);
}

function cleanHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_]+/g, '');
}

function readFileWithEncodingDetection(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  try {
    const utf8Str = buffer.toString('utf-8');
    if (!utf8Str.includes('\ufffd')) {
      return utf8Str;
    }
  } catch {
    // fallback
  }
  return buffer.toString('latin1');
}

function detectDrawType(filePath: string): LotoDrawType {
  const base = path.basename(filePath).toLowerCase();
  if (base.includes('grandloto') || base.includes('lotonoel')) {
    return 'grandloto';
  }
  if (base.includes('superloto') || base.includes('sloto')) {
    return 'superloto';
  }
  return 'loto';
}

/**
 * Parse un seul fichier CSV du Loto FDJ.
 */
export function parseLotoCsv(filePath: string): CompactLotoDraw[] {
  const content = readFileWithEncodingDetection(filePath);
  const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (rawLines.length < 2) return [];

  const delimiter = ';';
  const rawHeaders = rawLines[0].split(delimiter).map((h) => h.trim());
  const cleanHeaders = rawHeaders.map(cleanHeader);

  // Colonne Date
  const dateColIdx = cleanHeaders.findIndex(
    (h) => h.includes('datedetirage') || h.includes('datetirage') || h === 'date'
  );
  if (dateColIdx === -1) return [];

  // Colonnes des 5 boules
  const ballIndices: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const idx = cleanHeaders.findIndex(
      (h) => h === `boule${i}` || h === `b${i}` || h === `n${i}`
    );
    ballIndices.push(idx);
  }
  if (ballIndices.some((idx) => idx === -1)) return [];

  // Colonne Numéro Chance
  const chanceColIdx = cleanHeaders.findIndex(
    (h) => h.includes('numerochance') || h.includes('chance') || h === 'c'
  );
  if (chanceColIdx === -1) return [];

  // Déterminer le format des rangs : 9 rangs (post-2017) ou 6 rangs (2008-2017)
  const hasRank7 = cleanHeaders.some((h) => h.includes('rapportdurang7'));
  const isOldRanksFormat = !hasRank7;

  // Indices des rapports de rangs
  const rankIndices: number[] = [];
  for (let r = 1; r <= 9; r++) {
    const idx = cleanHeaders.findIndex((h) => h.includes(`rapportdurang${r}`));
    rankIndices.push(idx);
  }

  const drawType = detectDrawType(filePath);
  const draws: CompactLotoDraw[] = [];

  for (let lineNum = 1; lineNum < rawLines.length; lineNum++) {
    const row = rawLines[lineNum].split(delimiter).map((c) => c.trim());
    if (row.length < 6) continue;

    // 1. Date
    const isoDate = normalizeDate(row[dateColIdx]);
    if (!isoDate) continue;

    // 2. Boules (1..49)
    const numbers = ballIndices
      .map((idx) => parseInt(row[idx], 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 49);

    if (numbers.length !== 5 || new Set(numbers).size !== 5) {
      continue;
    }

    // 3. Numéro Chance (1..10)
    const chance = parseInt(row[chanceColIdx], 10);
    if (!Number.isInteger(chance) || chance < 1 || chance > 10) {
      continue;
    }

    numbers.sort((a, b) => a - b);

    // 4. Montants des gains par rang
    const payouts = [...DEFAULT_LOTO_PAYOUTS];

    if (isOldRanksFormat) {
      // Format 2008-2017 (6 rangs)
      for (let r = 1; r <= 6; r++) {
        const idx = rankIndices[r - 1];
        if (idx !== -1 && row[idx]) {
          const val = parseFloat(row[idx].replace(/\s/g, '').replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            if (r === 1) payouts[0] = Math.round(val);
            else if (r === 2) payouts[1] = Math.round(val);
            else if (r === 3) { payouts[2] = Math.round(val); payouts[3] = Math.round(val); }
            else if (r === 4) { payouts[4] = Math.round(val); payouts[5] = Math.round(val); }
            else if (r === 5) { payouts[6] = Math.round(val); payouts[7] = Math.round(val); }
            else if (r === 6) payouts[8] = Math.round(val * 10) / 10;
          }
        }
      }
    } else {
      // Format moderne (9 rangs)
      for (let r = 1; r <= 9; r++) {
        const idx = rankIndices[r - 1];
        if (idx !== -1 && row[idx]) {
          const val = parseFloat(row[idx].replace(/\s/g, '').replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            payouts[r - 1] = r <= 2 ? Math.round(val) : Math.round(val * 10) / 10;
          }
        }
      }
    }

    draws.push({
      d: isoDate,
      n: numbers,
      c: chance,
      t: drawType,
      p: payouts,
    });
  }

  return draws;
}

/**
 * Fonction principale : scanne le dossier, déduplique, trie chronologiquement et écrit le fichier JSON compact.
 */
export function compileLotoDataset(inputDir: string, outputFile: string): CompactLotoDraw[] {
  console.log(`[Loto Compiler] Scanning directory: ${inputDir}`);

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`);
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map((f) => path.join(inputDir, f));

  if (files.length === 0) {
    throw new Error(`No CSV files found in ${inputDir}`);
  }

  console.log(`[Loto Compiler] Found ${files.length} CSV files:`);
  files.forEach((f) => console.log(`  - ${path.basename(f)}`));

  const drawsMap = new Map<string, CompactLotoDraw>();
  let totalProcessedRows = 0;

  for (const file of files) {
    const fileDraws = parseLotoCsv(file);
    totalProcessedRows += fileDraws.length;
    console.log(
      `  ✓ ${path.basename(file)}: ${fileDraws.length} tirages valides extraits (${detectDrawType(file)}).`
    );

    for (const draw of fileDraws) {
      if (!drawsMap.has(draw.d)) {
        drawsMap.set(draw.d, draw);
      }
    }
  }

  // Tri chronologique ascendant (du plus ancien au plus récent)
  const compiledDraws = Array.from(drawsMap.values()).sort((a, b) =>
    a.d.localeCompare(b.d)
  );

  console.log(`\n[Loto Compiler] Total tirages analysés: ${totalProcessedRows}`);
  console.log(`[Loto Compiler] Tirages uniques consolidés: ${compiledDraws.length}`);

  const countsByType = { loto: 0, superloto: 0, grandloto: 0 };
  compiledDraws.forEach((d) => {
    countsByType[d.t]++;
  });
  console.log(`[Loto Compiler] Répartition: Loto = ${countsByType.loto}, Super Loto = ${countsByType.superloto}, Grand Loto = ${countsByType.grandloto}`);

  if (compiledDraws.length > 0) {
    console.log(
      `[Loto Compiler] Période couverte: du ${compiledDraws[0].d} au ${compiledDraws[compiledDraws.length - 1].d}`
    );
  }

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonContent = JSON.stringify(compiledDraws);
  fs.writeFileSync(outputFile, jsonContent, 'utf-8');

  const sizeKb = (Buffer.byteLength(jsonContent, 'utf-8') / 1024).toFixed(1);
  console.log(`[Loto Compiler] Fichier généré avec succès: ${outputFile} (${sizeKb} Ko)`);

  return compiledDraws;
}

// Exécution CLI si lancé directement
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('convertLotoCsv.ts') || process.argv[1].endsWith('convertLotoCsv.js'));

if (isDirectRun) {
  const defaultInputDir = path.join(__dirname, 'data', 'loto');
  const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultInputDir;

  const defaultOutputFile = path.resolve('public/data/loto-history.json');
  const outputFile = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutputFile;

  try {
    compileLotoDataset(inputDir, outputFile);
  } catch (err: any) {
    console.error(`[Loto Compiler] Error: ${err.message}`);
    process.exit(1);
  }
}


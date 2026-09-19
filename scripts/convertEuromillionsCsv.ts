import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Support both ESM and CJS execution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CompactEuromillionsDraw {
  d: string; // Format ISO: "YYYY-MM-DD"
  n: number[]; // 5 numéros triés (1..50)
  s: number[]; // 2 étoiles triées (1..12)
}

/**
 * Normalise une chaîne de date hétérogène FDJ en format ISO "YYYY-MM-DD".
 * Gère:
 * - YYYYMMDD (ex: 20110506)
 * - DD/MM/YYYY (ex: 15/09/2026)
 * - DD/MM/YY (ex: 23/09/16)
 * - YYYY-MM-DD (ISO standard)
 * - DD-MM-YYYY
 */
export function normalizeDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const str = raw.trim();
  if (!str) return null;

  // Format 1: YYYYMMDD (8 chiffres d'affilée)
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
      let [p1, p2, p3] = parts.map((p) => p.trim());
      if (p1.length === 4) {
        // YYYY-MM-DD
        const date = `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
        return isValidIsoDate(date) ? date : null;
      }
      if (p3.length === 2 || p3.length === 4) {
        // DD-MM-YYYY ou DD-MM-YY
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

/**
 * Nettoie une chaîne de colonne pour la recherche d'en-tête (minuscules, sans accents ni tirets/espaces).
 */
function cleanHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_]+/g, '');
}

/**
 * Lit un fichier brut en détectant automatiquement s'il s'agit d'UTF-8 ou de Latin1 (Windows-1252).
 */
function readFileWithEncodingDetection(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  try {
    const utf8Str = buffer.toString('utf-8');
    // Si le décodage UTF-8 produit des caractères de remplacement (\ufffd), privilégier latin1
    if (!utf8Str.includes('\ufffd')) {
      return utf8Str;
    }
  } catch {
    // ignore
  }
  return buffer.toString('latin1');
}

/**
 * Parse un seul fichier CSV de l'EuroMillions.
 */
export function parseEuromillionsCsv(
  filePath: string
): CompactEuromillionsDraw[] {
  const content = readFileWithEncodingDetection(filePath);
  const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (rawLines.length < 2) {
    return [];
  }

  // Détection du séparateur (; ou ,)
  const headerLine = rawLines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount >= commaCount ? ';' : ',';

  const rawHeaders = headerLine.split(delimiter).map((h) => h.trim());
  const cleanHeaders = rawHeaders.map(cleanHeader);

  // Index de la colonne Date
  const dateColIdx = cleanHeaders.findIndex(
    (h) =>
      h.includes('datedetirage') ||
      h.includes('datetirage') ||
      h === 'date'
  );

  // Colonnes des 5 boules
  const ballIndices: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const idx = cleanHeaders.findIndex(
      (h) =>
        h === `boule${i}` ||
        h === `n${i}` ||
        h === `ball${i}` ||
        h === `num${i}`
    );
    ballIndices.push(idx);
  }

  // Colonnes des 2 étoiles
  const starIndices: number[] = [];
  for (let i = 1; i <= 2; i++) {
    const idx = cleanHeaders.findIndex(
      (h) =>
        h === `etoile${i}` ||
        h === `e${i}` ||
        h === `star${i}` ||
        h === `starball${i}`
    );
    starIndices.push(idx);
  }

  // Index de secours pour extraction des chaînes concaténées FDJ
  const fallbackBallsIdx = cleanHeaders.findIndex((h) =>
    h.includes('boulesgagnantes')
  );
  const fallbackStarsIdx = cleanHeaders.findIndex((h) =>
    h.includes('etoilesgagnantes')
  );

  const draws: CompactEuromillionsDraw[] = [];

  for (let lineNum = 1; lineNum < rawLines.length; lineNum++) {
    const row = rawLines[lineNum].split(delimiter).map((c) => c.trim());
    if (row.length < 5) continue;

    // 1. Extraction et validation de la date
    const rawDateVal = dateColIdx !== -1 ? row[dateColIdx] : row[2];
    const isoDate = normalizeDate(rawDateVal);
    if (!isoDate) continue;

    // 2. Extraction des 5 boules
    let numbers: number[] = [];
    const hasExplicitBallCols = ballIndices.every((idx) => idx !== -1);

    if (hasExplicitBallCols) {
      numbers = ballIndices
        .map((idx) => parseInt(row[idx], 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 50);
    }

    // Fallback si colonnes introuvables ou incomplètes : format "-11-16-20-22-28-"
    if (numbers.length !== 5 && fallbackBallsIdx !== -1 && row[fallbackBallsIdx]) {
      const parsedFromPattern = row[fallbackBallsIdx]
        .split('-')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 50);
      if (parsedFromPattern.length === 5) {
        numbers = parsedFromPattern;
      }
    }

    if (numbers.length !== 5 || new Set(numbers).size !== 5) {
      continue;
    }

    // 3. Extraction des 2 étoiles
    let stars: number[] = [];
    const hasExplicitStarCols = starIndices.every((idx) => idx !== -1);

    if (hasExplicitStarCols) {
      stars = starIndices
        .map((idx) => parseInt(row[idx], 10))
        .filter((s) => Number.isInteger(s) && s >= 1 && s <= 12);
    }

    // Fallback étoiles : format "-4-9-"
    if (stars.length !== 2 && fallbackStarsIdx !== -1 && row[fallbackStarsIdx]) {
      const parsedFromPattern = row[fallbackStarsIdx]
        .split('-')
        .map((s) => parseInt(s.trim(), 10))
        .filter((s) => Number.isInteger(s) && s >= 1 && s <= 12);
      if (parsedFromPattern.length === 2) {
        stars = parsedFromPattern;
      }
    }

    if (stars.length !== 2 || new Set(stars).size !== 2) {
      continue;
    }

    // Tri ascendant strict des numéros et des étoiles
    numbers.sort((a, b) => a - b);
    stars.sort((a, b) => a - b);

    draws.push({
      d: isoDate,
      n: numbers,
      s: stars,
    });
  }

  return draws;
}

/**
 * Fonction principale : scanne le dossier, déduplique, trie chronologiquement et écrit le fichier JSON compact.
 */
export function compileEuromillionsDataset(
  inputDir: string,
  outputFile: string
) {
  console.log(`[EuroMillions Compiler] Scanning directory: ${inputDir}`);

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

  console.log(`[EuroMillions Compiler] Found ${files.length} CSV files:`);
  files.forEach((f) => console.log(`  - ${path.basename(f)}`));

  // Utilisation d'une Map pour dédupliquer par date standardisée
  const drawsMap = new Map<string, CompactEuromillionsDraw>();
  let totalProcessedRows = 0;

  for (const file of files) {
    const fileDraws = parseEuromillionsCsv(file);
    totalProcessedRows += fileDraws.length;
    console.log(
      `  ✓ ${path.basename(file)}: ${fileDraws.length} tirages valides extraits.`
    );

    for (const draw of fileDraws) {
      // Déduplication par date ISO
      if (!drawsMap.has(draw.d)) {
        drawsMap.set(draw.d, draw);
      }
    }
  }

  // Tri chronologique ascendant (du plus ancien au plus récent)
  const compiledDraws = Array.from(drawsMap.values()).sort((a, b) =>
    a.d.localeCompare(b.d)
  );

  console.log(`\n[EuroMillions Compiler] Total tirages analysés: ${totalProcessedRows}`);
  console.log(`[EuroMillions Compiler] Tirages uniques consolidés: ${compiledDraws.length}`);

  if (compiledDraws.length > 0) {
    console.log(`[EuroMillions Compiler] Période couverte: du ${compiledDraws[0].d} au ${compiledDraws[compiledDraws.length - 1].d}`);
  }

  // Création du répertoire de sortie si nécessaire
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Écriture du fichier JSON compact (pas d'indentation superflue pour optimiser le poids)
  const jsonContent = JSON.stringify(compiledDraws);
  fs.writeFileSync(outputFile, jsonContent, 'utf-8');

  const sizeKb = (Buffer.byteLength(jsonContent, 'utf-8') / 1024).toFixed(1);
  console.log(`[EuroMillions Compiler] Fichier généré avec succès: ${outputFile} (${sizeKb} Ko)`);

  return compiledDraws;
}

// Exécution CLI si lancé directement
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('convertEuromillionsCsv.ts') ||
    process.argv[1].endsWith('convertEuromillionsCsv.js'));

if (isDirectRun) {
  const defaultInputDir = path.join(__dirname, 'data');
  const inputDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : fs.existsSync(defaultInputDir)
    ? defaultInputDir
    : path.resolve('scripts/data');

  const defaultOutputFile = path.resolve('public/data/euromillions-history.json');
  const outputFile = process.argv[3]
    ? path.resolve(process.argv[3])
    : defaultOutputFile;

  try {
    compileEuromillionsDataset(inputDir, outputFile);
  } catch (err: any) {
    console.error(`[EuroMillions Compiler] Error: ${err.message}`);
    process.exit(1);
  }
}

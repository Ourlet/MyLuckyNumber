export type LotoDrawType = 'loto' | 'superloto' | 'grandloto';

export interface CompactLotoDraw {
  d: string; // Format ISO: "YYYY-MM-DD"
  n: number[]; // 5 numéros triés (1..49)
  c: number; // Numéro Chance (1..10)
  t?: LotoDrawType; // Type de tirage (loto, superloto, grandloto)
  p?: number[]; // [r1, r2, r3, r4, r5, r6, r7, r8, r9] montants des gains réels en €
}

export interface LotoUserTicket {
  numbers: number[]; // 5 numéros
  chance: number | null; // 1 numéro Chance (1..10)
}

export interface LotoRankDefinition {
  key: string;
  matchNumbers: number;
  needChance: boolean;
  label: string;
  shortLabel: string;
  defaultPayoutEur: number;
}

export interface LotoWinningDraw {
  date: string;
  amount: number;
  rankKey: string;
  rankLabel: string;
  matchedNumbers: number[];
  matchedChance: boolean;
  drawNumbers: number[];
  drawChance: number;
  drawType?: LotoDrawType;
}

export interface LotoRankStat {
  definition: LotoRankDefinition;
  count: number;
  totalAmount: number;
}

export interface LotoSimulationSummary {
  totalWinnings: number;
  totalCost: number;
  netProfit: number;
  roiPercentage: number;
  drawsCount: number;
  winningDrawsCount: number;
  bestDraw: {
    date: string;
    amount: number;
    matchedNumbers: number[];
    matchedChance: boolean;
    rankLabel: string;
    drawType?: LotoDrawType;
  } | null;
  rankCounts: Record<string, number>;
  rankStats: LotoRankStat[];
  winningDraws: LotoWinningDraw[];
}

export interface LotoItemFrequency {
  value: number;
  count: number;
  frequencyPercentage: number;
  lastDrawnDate: string;
  drawsSinceLastDrawn: number;
}

export interface LotoStats {
  hotNumbers: LotoItemFrequency[];
  coldNumbers: LotoItemFrequency[];
  hotChance: LotoItemFrequency[];
  coldChance: LotoItemFrequency[];
  totalDraws: number;
}


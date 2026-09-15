export interface DrawResult {
  id: string; // Ex: "2025-12-31-swisslotto"
  date: string; // Format ISO "YYYY-MM-DD"
  numbers: number[]; // Tableau trié de 6 entiers (1 à 42)
  bonus: number; // Numéro Chance (1 à 6)
  joker?: string; // 6 chiffres
  replay?: number; // 1 à 13
  payouts: {
    rank6_1: number; // 6 + Chance (défaut: 1'500'000 CHF)
    rank6_0: number; // 6 (défaut: 1'000'000 CHF)
    rank5_1: number; // 5 + Chance (défaut: 8'500 CHF)
    rank5_0: number; // 5 (défaut: 1'000 CHF)
    rank4_1: number; // 4 + Chance (défaut: 140 CHF)
    rank4_0: number; // 4 (défaut: 75 CHF)
    rank3_1: number; // 3 + Chance (défaut: 25 CHF)
    rank3_0: number; // 3 (défaut: 10 CHF)
  };
}

export interface WinningDraw {
  id: string;
  date: string;
  amount: number;
  rankKey: string;
  rankLabel: string;
  matchedCount: number;
  matchedBonus: boolean;
  matchedNumbers: number[];
  drawNumbers: number[];
  drawBonus: number;
}

export interface RankDefinition {
  key: string;
  matchCount: number;
  needBonus: boolean;
  label: string;
  shortLabel: string;
  defaultPayout: number;
}

export interface RankStat {
  definition: RankDefinition;
  count: number;
  totalAmount: number;
}

export interface SimulationSummary {
  totalWinnings: number;
  totalCost: number; // 2.50 CHF × nombre total de tirages analysés
  netProfit: number;
  roiPercentage: number;
  drawsCount: number;
  winningDrawsCount: number;
  bestDraw: {
    id: string;
    date: string;
    amount: number;
    matchCount: number;
    hasBonus: boolean;
    rankLabel: string;
  } | null;
  rankCounts: Record<string, number>;
  rankStats: RankStat[];
  winningDraws: WinningDraw[];
}

export interface UserTicket {
  numbers: number[]; // 6 numéros triés (1 à 42)
  bonus: number | null; // Numéro Chance (1 à 6)
}

export interface NumberFrequency {
  number: number;
  count: number;
  frequencyPercentage: number;
  lastDrawnDate: string;
  drawsSinceLastDrawn: number;
}

export interface BonusFrequency {
  bonus: number;
  count: number;
  frequencyPercentage: number;
}

export interface LotteryStats {
  hotNumbers: NumberFrequency[]; // Top 6 numéros les plus fréquemment sortis
  coldNumbers: NumberFrequency[]; // Top 6 numéros les plus en retard
  bonusFrequencies: BonusFrequency[]; // Fréquences des boules Chance 1 à 6
  mostFrequentBonus: number; // La boule Chance la plus récurrente
  totalDraws: number;
}

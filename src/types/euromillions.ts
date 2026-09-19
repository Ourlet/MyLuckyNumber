export interface CompactEuromillionsDraw {
  d: string; // "YYYY-MM-DD"
  n: number[]; // 5 numéros triés (1..50)
  s: number[]; // 2 étoiles triées (1..12)
}

export interface EuromillionsUserTicket {
  numbers: number[]; // 5 numéros
  stars: number[]; // 2 étoiles
}

export interface EuromillionsRankDefinition {
  key: string;
  matchNumbers: number;
  matchStars: number;
  label: string;
  shortLabel: string;
  defaultPayoutEur: number;
}

export interface EuromillionsWinningDraw {
  date: string;
  amount: number;
  rankKey: string;
  rankLabel: string;
  matchedNumbers: number[];
  matchedStars: number[];
  drawNumbers: number[];
  drawStars: number[];
}

export interface EuromillionsRankStat {
  definition: EuromillionsRankDefinition;
  count: number;
  totalAmount: number;
}

export interface EuromillionsSimulationSummary {
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
    matchedStars: number[];
    rankLabel: string;
  } | null;
  rankCounts: Record<string, number>;
  rankStats: EuromillionsRankStat[];
  winningDraws: EuromillionsWinningDraw[];
}

export interface ItemFrequency {
  value: number;
  count: number;
  frequencyPercentage: number;
  lastDrawnDate: string;
  drawsSinceLastDrawn: number;
}

export interface EuromillionsStats {
  hotNumbers: ItemFrequency[];
  coldNumbers: ItemFrequency[];
  hotStars: ItemFrequency[];
  coldStars: ItemFrequency[];
  totalDraws: number;
}

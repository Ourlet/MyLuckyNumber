import {
  CompactLotoDraw,
  LotoItemFrequency,
  LotoRankDefinition,
  LotoRankStat,
  LotoSimulationSummary,
  LotoStats,
  LotoWinningDraw,
} from '../types/loto';

export const LOTO_COST = 2.2; // 2,20 € prix officiel d'une grille Loto FDJ
export const EUR_TO_CHF_RATE = 0.95;

export const LOTO_RANKS: LotoRankDefinition[] = [
  {
    key: 'rank_loto_5_1',
    matchNumbers: 5,
    needChance: true,
    label: '5 numéros + N° Chance',
    shortLabel: '5 + 1',
    defaultPayoutEur: 5000000,
  },
  {
    key: 'rank_loto_5_0',
    matchNumbers: 5,
    needChance: false,
    label: '5 numéros',
    shortLabel: '5',
    defaultPayoutEur: 100000,
  },
  {
    key: 'rank_loto_4_1',
    matchNumbers: 4,
    needChance: true,
    label: '4 numéros + N° Chance',
    shortLabel: '4 + 1',
    defaultPayoutEur: 1000,
  },
  {
    key: 'rank_loto_4_0',
    matchNumbers: 4,
    needChance: false,
    label: '4 numéros',
    shortLabel: '4',
    defaultPayoutEur: 500,
  },
  {
    key: 'rank_loto_3_1',
    matchNumbers: 3,
    needChance: true,
    label: '3 numéros + N° Chance',
    shortLabel: '3 + 1',
    defaultPayoutEur: 50,
  },
  {
    key: 'rank_loto_3_0',
    matchNumbers: 3,
    needChance: false,
    label: '3 numéros',
    shortLabel: '3',
    defaultPayoutEur: 20,
  },
  {
    key: 'rank_loto_2_1',
    matchNumbers: 2,
    needChance: true,
    label: '2 numéros + N° Chance',
    shortLabel: '2 + 1',
    defaultPayoutEur: 10,
  },
  {
    key: 'rank_loto_2_0',
    matchNumbers: 2,
    needChance: false,
    label: '2 numéros',
    shortLabel: '2',
    defaultPayoutEur: 5,
  },
  {
    key: 'rank_loto_chance',
    matchNumbers: 0,
    needChance: true,
    label: 'N° Chance seul (0 ou 1 n° + Chance)',
    shortLabel: 'Chance',
    defaultPayoutEur: 2.2,
  },
];

export function matchLotoRank(
  matchedNumCount: number,
  matchedChance: boolean
): { rank: LotoRankDefinition; rankIndex: number } | null {
  if (matchedNumCount === 5) {
    return matchedChance
      ? { rank: LOTO_RANKS[0], rankIndex: 0 }
      : { rank: LOTO_RANKS[1], rankIndex: 1 };
  }
  if (matchedNumCount === 4) {
    return matchedChance
      ? { rank: LOTO_RANKS[2], rankIndex: 2 }
      : { rank: LOTO_RANKS[3], rankIndex: 3 };
  }
  if (matchedNumCount === 3) {
    return matchedChance
      ? { rank: LOTO_RANKS[4], rankIndex: 4 }
      : { rank: LOTO_RANKS[5], rankIndex: 5 };
  }
  if (matchedNumCount === 2) {
    return matchedChance
      ? { rank: LOTO_RANKS[6], rankIndex: 6 }
      : { rank: LOTO_RANKS[7], rankIndex: 7 };
  }
  if ((matchedNumCount === 0 || matchedNumCount === 1) && matchedChance) {
    return { rank: LOTO_RANKS[8], rankIndex: 8 };
  }
  return null;
}

export function calculateLotoSimulation(
  userNumbers: number[],
  userChance: number | null,
  draws: CompactLotoDraw[],
  costPerDraw: number = LOTO_COST,
  currency: 'CHF' | 'EUR' = 'EUR'
): LotoSimulationSummary {
  const conversionRate = currency === 'CHF' ? EUR_TO_CHF_RATE : 1;
  const totalCost = draws.length * costPerDraw;
  let totalWinnings = 0;
  const rankCounts: Record<string, number> = {};
  const rankSums: Record<string, number> = {};

  LOTO_RANKS.forEach((r) => {
    rankCounts[r.key] = 0;
    rankSums[r.key] = 0;
  });

  const winningDraws: LotoWinningDraw[] = [];
  const userNumSet = new Set(userNumbers);

  let bestDraw: LotoSimulationSummary['bestDraw'] = null;

  if (userNumbers.length !== 5 || userChance === null) {
    return {
      totalWinnings: 0,
      totalCost,
      netProfit: -totalCost,
      roiPercentage: -100,
      drawsCount: draws.length,
      winningDrawsCount: 0,
      bestDraw: null,
      rankCounts,
      rankStats: LOTO_RANKS.map((definition) => ({
        definition,
        count: 0,
        totalAmount: 0,
      })),
      winningDraws: [],
    };
  }

  for (const draw of draws) {
    const matchedNumbers = draw.n.filter((n) => userNumSet.has(n));
    const matchedChance = userChance === draw.c;

    const match = matchLotoRank(matchedNumbers.length, matchedChance);

    if (match) {
      const { rank, rankIndex } = match;
      const rawPayoutEur =
        draw.p && draw.p[rankIndex] !== undefined && draw.p[rankIndex] > 0
          ? draw.p[rankIndex]
          : rank.defaultPayoutEur;

      const payout = Math.round(rawPayoutEur * conversionRate * 10) / 10;
      totalWinnings += payout;
      rankCounts[rank.key] = (rankCounts[rank.key] || 0) + 1;
      rankSums[rank.key] = (rankSums[rank.key] || 0) + payout;

      const winningDraw: LotoWinningDraw = {
        date: draw.d,
        amount: payout,
        rankKey: rank.key,
        rankLabel: rank.label,
        matchedNumbers,
        matchedChance,
        drawNumbers: draw.n,
        drawChance: draw.c,
        drawType: draw.t,
      };

      winningDraws.push(winningDraw);

      if (!bestDraw || payout > bestDraw.amount) {
        bestDraw = {
          date: draw.d,
          amount: payout,
          matchedNumbers,
          matchedChance,
          rankLabel: rank.label,
          drawType: draw.t,
        };
      }
    }
  }

  const rankStats: LotoRankStat[] = LOTO_RANKS.map((definition) => {
    return {
      definition,
      count: rankCounts[definition.key] || 0,
      totalAmount: Math.round((rankSums[definition.key] || 0) * 10) / 10,
    };
  });

  const netProfit = Math.round((totalWinnings - totalCost) * 10) / 10;
  const roiPercentage =
    totalCost > 0
      ? Math.round(((totalWinnings - totalCost) / totalCost) * 1000) / 10
      : 0;

  // Tri des tirages gagnants du plus récent au plus ancien
  winningDraws.sort((a, b) => b.date.localeCompare(a.date));

  return {
    totalWinnings: Math.round(totalWinnings * 10) / 10,
    totalCost: Math.round(totalCost * 10) / 10,
    netProfit,
    roiPercentage,
    drawsCount: draws.length,
    winningDrawsCount: winningDraws.length,
    bestDraw,
    rankCounts,
    rankStats,
    winningDraws,
  };
}

export function calculateLotoStats(draws: CompactLotoDraw[]): LotoStats {
  const numberCounts: Record<number, number> = {};
  const chanceCounts: Record<number, number> = {};
  const numberLastSeenIndex: Record<number, number> = {};
  const chanceLastSeenIndex: Record<number, number> = {};
  const numberLastSeenDate: Record<number, string> = {};
  const chanceLastSeenDate: Record<number, string> = {};

  for (let i = 1; i <= 49; i++) {
    numberCounts[i] = 0;
    numberLastSeenIndex[i] = -1;
    numberLastSeenDate[i] = '';
  }

  for (let i = 1; i <= 10; i++) {
    chanceCounts[i] = 0;
    chanceLastSeenIndex[i] = -1;
    chanceLastSeenDate[i] = '';
  }

  draws.forEach((draw, index) => {
    draw.n.forEach((num) => {
      if (numberCounts[num] !== undefined) {
        numberCounts[num]++;
        numberLastSeenIndex[num] = index;
        numberLastSeenDate[num] = draw.d;
      }
    });

    if (chanceCounts[draw.c] !== undefined) {
      chanceCounts[draw.c]++;
      chanceLastSeenIndex[draw.c] = index;
      chanceLastSeenDate[draw.c] = draw.d;
    }
  });

  const total = draws.length;

  const numberFreqs: LotoItemFrequency[] = [];
  for (let i = 1; i <= 49; i++) {
    const count = numberCounts[i];
    const lastIdx = numberLastSeenIndex[i];
    const drawsSince = lastIdx === -1 ? total : total - 1 - lastIdx;
    numberFreqs.push({
      value: i,
      count,
      frequencyPercentage: total > 0 ? (count / total) * 100 : 0,
      lastDrawnDate: numberLastSeenDate[i],
      drawsSinceLastDrawn: drawsSince,
    });
  }

  const chanceFreqs: LotoItemFrequency[] = [];
  for (let i = 1; i <= 10; i++) {
    const count = chanceCounts[i];
    const lastIdx = chanceLastSeenIndex[i];
    const drawsSince = lastIdx === -1 ? total : total - 1 - lastIdx;
    chanceFreqs.push({
      value: i,
      count,
      frequencyPercentage: total > 0 ? (count / total) * 100 : 0,
      lastDrawnDate: chanceLastSeenDate[i],
      drawsSinceLastDrawn: drawsSince,
    });
  }

  const hotNumbers = [...numberFreqs]
    .sort((a, b) => b.count - a.count || b.value - a.value)
    .slice(0, 5);

  const coldNumbers = [...numberFreqs]
    .sort((a, b) => b.drawsSinceLastDrawn - a.drawsSinceLastDrawn || a.count - b.count)
    .slice(0, 5);

  const hotChance = [...chanceFreqs]
    .sort((a, b) => b.count - a.count || b.value - a.value)
    .slice(0, 3);

  const coldChance = [...chanceFreqs]
    .sort((a, b) => b.drawsSinceLastDrawn - a.drawsSinceLastDrawn || a.count - b.count)
    .slice(0, 3);

  return {
    hotNumbers,
    coldNumbers,
    hotChance,
    coldChance,
    totalDraws: total,
  };
}

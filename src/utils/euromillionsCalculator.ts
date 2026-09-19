import {
  CompactEuromillionsDraw,
  EuromillionsRankDefinition,
  EuromillionsRankStat,
  EuromillionsSimulationSummary,
  EuromillionsStats,
  EuromillionsWinningDraw,
  ItemFrequency,
} from '../types/euromillions';

export const EUROMILLIONS_COST = 2.5;

export const EUROMILLIONS_RANKS: EuromillionsRankDefinition[] = [
  {
    key: 'rank_5_2',
    matchNumbers: 5,
    matchStars: 2,
    label: '5 numéros + 2 étoiles',
    shortLabel: '5 + 2 ★',
    defaultPayoutEur: 35000000,
  },
  {
    key: 'rank_5_1',
    matchNumbers: 5,
    matchStars: 1,
    label: '5 numéros + 1 étoile',
    shortLabel: '5 + 1 ★',
    defaultPayoutEur: 250000,
  },
  {
    key: 'rank_5_0',
    matchNumbers: 5,
    matchStars: 0,
    label: '5 numéros',
    shortLabel: '5',
    defaultPayoutEur: 30000,
  },
  {
    key: 'rank_4_2',
    matchNumbers: 4,
    matchStars: 2,
    label: '4 numéros + 2 étoiles',
    shortLabel: '4 + 2 ★',
    defaultPayoutEur: 1500,
  },
  {
    key: 'rank_4_1',
    matchNumbers: 4,
    matchStars: 1,
    label: '4 numéros + 1 étoile',
    shortLabel: '4 + 1 ★',
    defaultPayoutEur: 120,
  },
  {
    key: 'rank_3_2',
    matchNumbers: 3,
    matchStars: 2,
    label: '3 numéros + 2 étoiles',
    shortLabel: '3 + 2 ★',
    defaultPayoutEur: 60,
  },
  {
    key: 'rank_4_0',
    matchNumbers: 4,
    matchStars: 0,
    label: '4 numéros',
    shortLabel: '4',
    defaultPayoutEur: 40,
  },
  {
    key: 'rank_2_2',
    matchNumbers: 2,
    matchStars: 2,
    label: '2 numéros + 2 étoiles',
    shortLabel: '2 + 2 ★',
    defaultPayoutEur: 15,
  },
  {
    key: 'rank_3_1',
    matchNumbers: 3,
    matchStars: 1,
    label: '3 numéros + 1 étoile',
    shortLabel: '3 + 1 ★',
    defaultPayoutEur: 12,
  },
  {
    key: 'rank_3_0',
    matchNumbers: 3,
    matchStars: 0,
    label: '3 numéros',
    shortLabel: '3',
    defaultPayoutEur: 9,
  },
  {
    key: 'rank_1_2',
    matchNumbers: 1,
    matchStars: 2,
    label: '1 numéro + 2 étoiles',
    shortLabel: '1 + 2 ★',
    defaultPayoutEur: 7,
  },
  {
    key: 'rank_2_1',
    matchNumbers: 2,
    matchStars: 1,
    label: '2 numéros + 1 étoile',
    shortLabel: '2 + 1 ★',
    defaultPayoutEur: 6,
  },
  {
    key: 'rank_2_0',
    matchNumbers: 2,
    matchStars: 0,
    label: '2 numéros',
    shortLabel: '2',
    defaultPayoutEur: 4,
  },
];

export function matchEuromillionsRank(
  matchedNumCount: number,
  matchedStarCount: number
): EuromillionsRankDefinition | null {
  for (const rank of EUROMILLIONS_RANKS) {
    if (
      rank.matchNumbers === matchedNumCount &&
      rank.matchStars === matchedStarCount
    ) {
      return rank;
    }
  }
  return null;
}

export const EUR_TO_CHF_RATE = 0.95;

export function calculateEuromillionsSimulation(
  userNumbers: number[],
  userStars: number[],
  draws: CompactEuromillionsDraw[],
  costPerDraw: number = EUROMILLIONS_COST,
  currency: 'CHF' | 'EUR' = 'EUR'
): EuromillionsSimulationSummary {
  const conversionRate = currency === 'CHF' ? EUR_TO_CHF_RATE : 1;
  const totalCost = draws.length * costPerDraw;
  let totalWinnings = 0;
  const rankCounts: Record<string, number> = {};
  EUROMILLIONS_RANKS.forEach((r) => {
    rankCounts[r.key] = 0;
  });

  const winningDraws: EuromillionsWinningDraw[] = [];
  const userNumSet = new Set(userNumbers);
  const userStarSet = new Set(userStars);

  let bestDraw: EuromillionsSimulationSummary['bestDraw'] = null;

  for (const draw of draws) {
    const matchedNumbers = draw.n.filter((n) => userNumSet.has(n));
    const matchedStars = draw.s.filter((s) => userStarSet.has(s));

    const rank = matchEuromillionsRank(
      matchedNumbers.length,
      matchedStars.length
    );

    if (rank) {
      const payout = Math.round(rank.defaultPayoutEur * conversionRate * 10) / 10;
      totalWinnings += payout;
      rankCounts[rank.key] = (rankCounts[rank.key] || 0) + 1;

      const winningDraw: EuromillionsWinningDraw = {
        date: draw.d,
        amount: payout,
        rankKey: rank.key,
        rankLabel: rank.label,
        matchedNumbers,
        matchedStars,
        drawNumbers: draw.n,
        drawStars: draw.s,
      };

      winningDraws.push(winningDraw);

      if (!bestDraw || payout > bestDraw.amount) {
        bestDraw = {
          date: draw.d,
          amount: payout,
          matchedNumbers,
          matchedStars,
          rankLabel: rank.label,
        };
      }
    }
  }

  const rankStats: EuromillionsRankStat[] = EUROMILLIONS_RANKS.map((definition) => {
    const count = rankCounts[definition.key] || 0;
    const rankPayout = Math.round(definition.defaultPayoutEur * conversionRate * 10) / 10;
    return {
      definition,
      count,
      totalAmount: count * rankPayout,
    };
  });

  const netProfit = totalWinnings - totalCost;
  const roiPercentage =
    totalCost > 0 ? ((totalWinnings - totalCost) / totalCost) * 100 : 0;

  return {
    totalWinnings,
    totalCost,
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

export function calculateEuromillionsStats(
  draws: CompactEuromillionsDraw[]
): EuromillionsStats {
  const totalDraws = draws.length;
  if (totalDraws === 0) {
    return {
      hotNumbers: [],
      coldNumbers: [],
      hotStars: [],
      coldStars: [],
      totalDraws: 0,
    };
  }

  const numberStats: ItemFrequency[] = Array.from({ length: 50 }, (_, i) => {
    const num = i + 1;
    let count = 0;
    let lastDrawnDate = '';
    let drawsSinceLastDrawn = -1;

    for (let idx = 0; idx < draws.length; idx++) {
      const draw = draws[idx];
      if (draw.n.includes(num)) {
        count++;
        if (!lastDrawnDate) {
          lastDrawnDate = draw.d;
          drawsSinceLastDrawn = idx;
        }
      }
    }

    if (drawsSinceLastDrawn === -1) {
      drawsSinceLastDrawn = draws.length;
    }

    return {
      value: num,
      count,
      frequencyPercentage: totalDraws > 0 ? (count / totalDraws) * 100 : 0,
      lastDrawnDate,
      drawsSinceLastDrawn,
    };
  });

  const starStats: ItemFrequency[] = Array.from({ length: 12 }, (_, i) => {
    const star = i + 1;
    let count = 0;
    let lastDrawnDate = '';
    let drawsSinceLastDrawn = -1;

    for (let idx = 0; idx < draws.length; idx++) {
      const draw = draws[idx];
      if (draw.s.includes(star)) {
        count++;
        if (!lastDrawnDate) {
          lastDrawnDate = draw.d;
          drawsSinceLastDrawn = idx;
        }
      }
    }

    if (drawsSinceLastDrawn === -1) {
      drawsSinceLastDrawn = draws.length;
    }

    return {
      value: star,
      count,
      frequencyPercentage: totalDraws > 0 ? (count / totalDraws) * 100 : 0,
      lastDrawnDate,
      drawsSinceLastDrawn,
    };
  });

  const sortedNumsByCount = [...numberStats].sort((a, b) => b.count - a.count);
  const sortedNumsByGap = [...numberStats].sort(
    (a, b) => b.drawsSinceLastDrawn - a.drawsSinceLastDrawn
  );

  const sortedStarsByCount = [...starStats].sort((a, b) => b.count - a.count);
  const sortedStarsByGap = [...starStats].sort(
    (a, b) => b.drawsSinceLastDrawn - a.drawsSinceLastDrawn
  );

  return {
    hotNumbers: sortedNumsByCount.slice(0, 5),
    coldNumbers: sortedNumsByGap.slice(0, 5),
    hotStars: sortedStarsByCount.slice(0, 2),
    coldStars: sortedStarsByGap.slice(0, 2),
    totalDraws,
  };
}

export function formatEUR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const rounded = Math.round(abs);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${isNegative ? '-' : ''}${formatted} €`;
}

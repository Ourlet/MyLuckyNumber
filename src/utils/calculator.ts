import {
  BonusFrequency,
  DrawResult,
  LotteryStats,
  NumberFrequency,
  RankDefinition,
  RankStat,
  SimulationSummary,
  WinningDraw,
} from '../types/lottery';

export const COST_PER_DRAW = 2.5;

export const SWISS_LOTTO_RANKS: RankDefinition[] = [
  {
    key: 'rank6_1',
    matchCount: 6,
    needBonus: true,
    label: '6 numéros + Chance',
    shortLabel: '6 + 1',
    defaultPayout: 1500000,
  },
  {
    key: 'rank6_0',
    matchCount: 6,
    needBonus: false,
    label: '6 numéros',
    shortLabel: '6',
    defaultPayout: 1000000,
  },
  {
    key: 'rank5_1',
    matchCount: 5,
    needBonus: true,
    label: '5 numéros + Chance',
    shortLabel: '5 + 1',
    defaultPayout: 8500,
  },
  {
    key: 'rank5_0',
    matchCount: 5,
    needBonus: false,
    label: '5 numéros',
    shortLabel: '5',
    defaultPayout: 1000,
  },
  {
    key: 'rank4_1',
    matchCount: 4,
    needBonus: true,
    label: '4 numéros + Chance',
    shortLabel: '4 + 1',
    defaultPayout: 140,
  },
  {
    key: 'rank4_0',
    matchCount: 4,
    needBonus: false,
    label: '4 numéros',
    shortLabel: '4',
    defaultPayout: 75,
  },
  {
    key: 'rank3_1',
    matchCount: 3,
    needBonus: true,
    label: '3 numéros + Chance',
    shortLabel: '3 + 1',
    defaultPayout: 25,
  },
  {
    key: 'rank3_0',
    matchCount: 3,
    needBonus: false,
    label: '3 numéros',
    shortLabel: '3',
    defaultPayout: 10,
  },
];

/**
 * Détermine le rang gagnant pour un tirage donné
 */
export function getRankKey(matchCount: number, hasBonus: boolean): string | null {
  if (matchCount === 6) return hasBonus ? 'rank6_1' : 'rank6_0';
  if (matchCount === 5) return hasBonus ? 'rank5_1' : 'rank5_0';
  if (matchCount === 4) return hasBonus ? 'rank4_1' : 'rank4_0';
  if (matchCount === 3) return hasBonus ? 'rank3_1' : 'rank3_0';
  return null;
}

/**
 * Moteur de calcul rétrospectif de simulation Swiss Lotto
 * @param userNumbers 6 numéros choisis par l'utilisateur (1 à 42)
 * @param userBonus Numéro Chance choisi par l'utilisateur (1 à 6)
 * @param draws Liste complète des tirages historiques
 */
export function calculateSimulation(
  userNumbers: number[],
  userBonus: number | null,
  draws: DrawResult[]
): SimulationSummary {
  const userSet = new Set(userNumbers);
  const isComplete = userNumbers.length === 6 && userBonus !== null;

  // Initialisation des compteurs par rang
  const rankCounts: Record<string, number> = {};
  const rankTotals: Record<string, number> = {};
  for (const r of SWISS_LOTTO_RANKS) {
    rankCounts[r.key] = 0;
    rankTotals[r.key] = 0;
  }

  if (!isComplete || draws.length === 0) {
    const totalCost = draws.length * COST_PER_DRAW;
    return {
      totalWinnings: 0,
      totalCost,
      netProfit: -totalCost,
      roiPercentage: -100,
      drawsCount: draws.length,
      winningDrawsCount: 0,
      bestDraw: null,
      rankCounts,
      rankStats: SWISS_LOTTO_RANKS.map((definition) => ({
        definition,
        count: 0,
        totalAmount: 0,
      })),
      winningDraws: [],
    };
  }

  let totalWinnings = 0;
  let winningDrawsCount = 0;
  let bestDraw: SimulationSummary['bestDraw'] = null;
  const winningDraws: WinningDraw[] = [];

  for (const draw of draws) {
    // Calcul des correspondances
    const matchedNumbers: number[] = [];
    for (const num of draw.numbers) {
      if (userSet.has(num)) {
        matchedNumbers.push(num);
      }
    }

    const matchCount = matchedNumbers.length;
    const matchedBonus = userBonus === draw.bonus;
    const rankKey = getRankKey(matchCount, matchedBonus);

    if (rankKey) {
      const rankDef = SWISS_LOTTO_RANKS.find((r) => r.key === rankKey);
      const amount =
        draw.payouts?.[rankKey as keyof DrawResult['payouts']] ??
        rankDef?.defaultPayout ??
        0;

      totalWinnings += amount;
      winningDrawsCount++;
      rankCounts[rankKey] = (rankCounts[rankKey] || 0) + 1;
      rankTotals[rankKey] = (rankTotals[rankKey] || 0) + amount;

      const rankLabel = rankDef?.label ?? rankKey;

      if (!bestDraw || amount > bestDraw.amount) {
        bestDraw = {
          id: draw.id,
          date: draw.date,
          amount,
          matchCount,
          hasBonus: matchedBonus,
          rankLabel,
        };
      }

      winningDraws.push({
        id: draw.id,
        date: draw.date,
        amount,
        rankKey,
        rankLabel,
        matchedCount: matchCount,
        matchedBonus,
        matchedNumbers: matchedNumbers.sort((a, b) => a - b),
        drawNumbers: draw.numbers,
        drawBonus: draw.bonus,
      });
    }
  }

  // Tri des tirages gagnants du plus récent au plus ancien (ordre décroissant de date)
  winningDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCost = draws.length * COST_PER_DRAW;
  const netProfit = totalWinnings - totalCost;
  const roiPercentage = totalCost > 0 ? ((totalWinnings - totalCost) / totalCost) * 100 : 0;

  const rankStats: RankStat[] = SWISS_LOTTO_RANKS.map((definition) => ({
    definition,
    count: rankCounts[definition.key] || 0,
    totalAmount: rankTotals[definition.key] || 0,
  }));

  return {
    totalWinnings,
    totalCost,
    netProfit,
    roiPercentage,
    drawsCount: draws.length,
    winningDrawsCount,
    bestDraw,
    rankCounts,
    rankStats,
    winningDraws,
  };
}

/**
 * Formatage suisse officiel des montants en Francs Suisses (CHF)
 * Ex: 1500000 -> "CHF 1'500'000.–" ou "CHF 12'450.00"
 */
export function formatCHF(amount: number, showCents = false): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  const parts = abs.toFixed(showCents ? 2 : 0).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  const formatted = showCents
    ? `${integerPart}.${parts[1]}`
    : `${integerPart}.–`;

  return `${isNegative ? '-' : ''}CHF ${formatted}`;
}

/**
 * Formatage lisible des dates francophones suisses
 * Ex: "2024-03-27" -> "27 mars 2024"
 */
export function formatSwissDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('fr-CH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Analyse statistique complète des tirages Swiss Lotto :
 * - Top 5 Chauds (🔥)
 * - Top 5 Froids / en retard (❄️)
 * - Fréquences des boules Chance 1 à 6
 */
export function calculateLotteryStats(draws: DrawResult[]): LotteryStats {
  if (!draws || draws.length === 0) {
    return {
      hotNumbers: [],
      coldNumbers: [],
      bonusFrequencies: [],
      mostFrequentBonus: 1,
      totalDraws: 0,
    };
  }

  // Tri chronologique décroissant pour déterminer avec exactitude le retard (gap)
  const sortedDraws = [...draws].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalDraws = sortedDraws.length;

  // 1. Fréquence et retard pour les numéros 1 à 42
  const numberStatsMap = new Map<
    number,
    { count: number; lastDrawnDate: string; drawsSinceLastDrawn: number }
  >();

  for (let n = 1; n <= 42; n++) {
    numberStatsMap.set(n, {
      count: 0,
      lastDrawnDate: '',
      drawsSinceLastDrawn: totalDraws,
    });
  }

  sortedDraws.forEach((draw, drawIndex) => {
    for (const num of draw.numbers) {
      const stat = numberStatsMap.get(num);
      if (stat) {
        stat.count++;
        if (stat.lastDrawnDate === '') {
          stat.lastDrawnDate = draw.date;
          stat.drawsSinceLastDrawn = drawIndex;
        }
      }
    }
  });

  const allNumberStats: NumberFrequency[] = Array.from(numberStatsMap.entries()).map(
    ([number, data]) => ({
      number,
      count: data.count,
      frequencyPercentage: (data.count / totalDraws) * 100,
      lastDrawnDate: data.lastDrawnDate,
      drawsSinceLastDrawn: data.drawsSinceLastDrawn,
    })
  );

  // Top 6 Chauds (🔥) : Fréquence la plus élevée
  const hotNumbers = [...allNumberStats]
    .sort((a, b) => b.count - a.count || a.drawsSinceLastDrawn - b.drawsSinceLastDrawn)
    .slice(0, 6);

  // Top 6 Froids (❄️) : Retard le plus élevé (dernière sortie la plus ancienne)
  const coldNumbers = [...allNumberStats]
    .sort((a, b) => b.drawsSinceLastDrawn - a.drawsSinceLastDrawn || a.count - b.count)
    .slice(0, 6);

  // 2. Fréquences des boules Chance 1 à 6
  const bonusCountMap = new Map<number, number>();
  for (let b = 1; b <= 6; b++) {
    bonusCountMap.set(b, 0);
  }

  for (const draw of sortedDraws) {
    if (draw.bonus >= 1 && draw.bonus <= 6) {
      bonusCountMap.set(draw.bonus, (bonusCountMap.get(draw.bonus) || 0) + 1);
    }
  }

  const bonusFrequencies: BonusFrequency[] = Array.from(bonusCountMap.entries()).map(
    ([bonus, count]) => ({
      bonus,
      count,
      frequencyPercentage: (count / totalDraws) * 100,
    })
  );

  // Déterminer la boule Chance la plus récurrente
  let mostFrequentBonus = 1;
  let maxBonusCount = -1;
  for (const item of bonusFrequencies) {
    if (item.count > maxBonusCount) {
      maxBonusCount = item.count;
      mostFrequentBonus = item.bonus;
    }
  }

  return {
    hotNumbers,
    coldNumbers,
    bonusFrequencies,
    mostFrequentBonus,
    totalDraws,
  };
}

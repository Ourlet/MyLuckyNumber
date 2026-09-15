import React, { useState, useMemo } from 'react';
import { SimulationSummary } from '../types/lottery';
import { formatCHF, formatSwissDate } from '../utils/calculator';

export interface ResultsDashboardProps {
  summary: SimulationSummary;
  userNumbers: number[];
  userBonus: number | null;
  className?: string;
}

const SWISS_RED = '#D52B1E';

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  summary,
  userNumbers,
  userBonus,
  className = '',
}) => {
  const [filterRank, setFilterRank] = useState<string>('all');

  const {
    totalWinnings,
    totalCost,
    netProfit,
    roiPercentage,
    drawsCount,
    winningDrawsCount,
    bestDraw,
    rankStats,
    winningDraws,
  } = summary;

  const isProfit = netProfit >= 0;
  const winRate = drawsCount > 0 ? ((winningDrawsCount / drawsCount) * 100).toFixed(1) : '0';

  // Filtrage optionnel de la liste des tirages gagnants
  const filteredDraws = useMemo(() => {
    if (filterRank === 'all') return winningDraws;
    return winningDraws.filter((d) => d.rankKey === filterRank);
  }, [winningDraws, filterRank]);

  return (
    <div className={`space-y-6 font-sans ${className}`}>
      {/* Récapitulatif de la combinaison analysée */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Grille analysée :
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {userNumbers.map((num) => (
              <span
                key={num}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: SWISS_RED }}
              >
                {num}
              </span>
            ))}
            <span className="text-slate-500 font-bold px-0.5">+</span>
            <span
              className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black ring-2 ring-amber-300 shadow-sm"
              title="Numéro Chance"
            >
              {userBonus}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Simulation sur <strong className="text-white">{drawsCount} tirages</strong> (2013–2026)
        </div>
      </div>

      {/* 1. KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 : Gain total cumulé */}
        <div className="relative overflow-hidden bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gain Total Cumulé
            </span>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
              style={{ backgroundColor: SWISS_RED }}
            >
              CHF
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {formatCHF(totalWinnings)}
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">{winningDrawsCount}</span> tirages gagnants
              sur <span className="font-semibold text-slate-700">{drawsCount}</span> analysés ({winRate}%)
            </p>
          </div>
        </div>

        {/* KPI 2 : Bilan Net (Bénéfice / Perte) */}
        <div
          className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all ${
            isProfit
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isProfit ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              Bilan Net Historique
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isProfit
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-rose-200 text-rose-800'
              }`}
            >
              ROI {roiPercentage > 0 ? `+${roiPercentage.toFixed(1)}%` : `${roiPercentage.toFixed(1)}%`}
            </span>
          </div>

          <div className="mt-3">
            <div
              className={`text-3xl sm:text-4xl font-black tracking-tight ${
                isProfit ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCHF(netProfit)}
            </div>
            <p
              className={`mt-1 text-xs ${
                isProfit ? 'text-emerald-700/80' : 'text-rose-700/80'
              }`}
            >
              Pour <span className="font-semibold">{formatCHF(totalCost, true)}</span> investis (2.50 CHF × {drawsCount})
            </p>
          </div>
        </div>

        {/* KPI 3 : Meilleur Gain Historique */}
        <div className="relative overflow-hidden bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Meilleur Gain Décroché
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-black shadow-sm">
              ★
            </span>
          </div>

          <div className="mt-3">
            {bestDraw ? (
              <>
                <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
                  {formatCHF(bestDraw.amount)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs text-slate-600">
                  <span>le {formatSwissDate(bestDraw.date)}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-[11px]">
                    {bestDraw.rankLabel}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">0 CHF</div>
                <p className="mt-1 text-xs text-slate-400">Aucun gain sur cette période</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tableau des rangs de gains */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Répartition par rang de gain</span>
            </h3>
            <p className="text-xs text-slate-500">
              Détail des 8 rangs officiels du Swiss Lotto
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            {winningDrawsCount} victoires au total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Rang</th>
                <th className="px-4 py-3">Combinaison</th>
                <th className="px-4 py-3 text-right">Cote moyenne</th>
                <th className="px-4 py-3 text-center">Victoires</th>
                <th className="px-5 py-3 text-right">Total remporté</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankStats.map(({ definition, count, totalAmount }) => {
                const hasWon = count > 0;
                return (
                  <tr
                    key={definition.key}
                    className={`transition-colors ${
                      hasWon ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center ${
                          hasWon
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {definition.shortLabel}
                      </span>
                      <span>{definition.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {definition.matchCount} numéros {definition.needBonus ? '+ Chance' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">
                      {formatCHF(definition.defaultPayout)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold ${
                          hasWon
                            ? 'bg-red-100 text-[#D52B1E]'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      {totalAmount > 0 ? (
                        <span className="text-[#D52B1E]">{formatCHF(totalAmount)}</span>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Liste des tirages gagnants */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Historique des tirages gagnants</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#D52B1E]/10 text-[#D52B1E]">
                {filteredDraws.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Classés du plus récent au plus ancien avec vos numéros trouvés
            </p>
          </div>

          {/* Filtre par rang */}
          {winningDraws.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="rank-filter" className="text-xs font-semibold text-slate-500">
                Filtrer :
              </label>
              <select
                id="rank-filter"
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
              >
                <option value="all">Tous les rangs ({winningDraws.length})</option>
                {rankStats
                  .filter((r) => r.count > 0)
                  .map((r) => (
                    <option key={r.definition.key} value={r.definition.key}>
                      {r.definition.label} ({r.count})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Liste scrollable des tirages gagnants */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4 space-y-2.5">
          {filteredDraws.length > 0 ? (
            filteredDraws.map((draw) => {
              return (
                <div
                  key={draw.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  {/* Date & Rang */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {formatSwissDate(draw.date)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-xs">
                        {draw.rankLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {draw.matchedCount} numéros trouvés
                      {draw.matchedBonus ? ' + Chance trouvée !' : ''}
                    </div>
                  </div>

                  {/* Numéros du tirage avec mise en évidence des correspondances */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {draw.drawNumbers.map((num) => {
                      const isMatched = userNumbers.includes(num);
                      return (
                        <div
                          key={num}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isMatched
                              ? 'text-white shadow-sm ring-2 ring-red-300 scale-105'
                              : 'bg-white text-slate-400 border border-slate-200'
                          }`}
                          style={isMatched ? { backgroundColor: SWISS_RED } : undefined}
                          title={isMatched ? `Numéro trouvé : ${num}` : `Numéro tiré : ${num}`}
                        >
                          {num}
                        </div>
                      );
                    })}

                    <span className="text-slate-400 font-bold px-0.5">+</span>

                    {/* Numéro Chance tiré */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black ring-2 transition-all ${
                        draw.matchedBonus
                          ? 'bg-amber-400 text-slate-950 ring-amber-300 shadow-sm scale-105'
                          : 'bg-white text-slate-400 ring-slate-200 border border-slate-200'
                      }`}
                      title={
                        draw.matchedBonus
                          ? `Numéro Chance trouvé ! (${draw.drawBonus})`
                          : `Numéro Chance tiré : ${draw.drawBonus}`
                      }
                    >
                      {draw.drawBonus}
                    </div>
                  </div>

                  {/* Montant gagné */}
                  <div className="text-right sm:min-w-[120px]">
                    <div className="text-base sm:text-lg font-black text-[#D52B1E]">
                      +{formatCHF(draw.amount)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">
                {winningDraws.length === 0
                  ? 'Aucun tirage gagnant trouvé pour cette combinaison.'
                  : 'Aucun tirage gagnant ne correspond au filtre sélectionné.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Mention légale discrète requise */}
      <footer className="text-center pt-2 pb-4">
        <p className="text-xs text-slate-400 tracking-wide">
          * Estimations basées sur les cotes moyennes officielles Swisslos (2.50 CHF / grille).
        </p>
      </footer>
    </div>
  );
};

export default ResultsDashboard;

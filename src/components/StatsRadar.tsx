import React, { useState } from 'react';
import { LotteryStats } from '../types/lottery';
import { formatSwissDate } from '../utils/calculator';

export interface StatsRadarProps {
  stats: LotteryStats;
  /** Callback déclenché pour appliquer le Top 5 chaud + Chance le plus fréquent */
  onApplyHotSelection?: (numbers: number[], bonus: number) => void;
  className?: string;
}

const SWISS_RED = '#D52B1E';

export const StatsRadar: React.FC<StatsRadarProps> = ({
  stats,
  onApplyHotSelection,
  className = '',
}) => {
  const [justApplied, setJustApplied] = useState(false);
  const { hotNumbers, coldNumbers, bonusFrequencies, mostFrequentBonus, totalDraws } = stats;

  const handleApply = () => {
    if (!onApplyHotSelection || hotNumbers.length === 0) return;
    const hot6 = hotNumbers.slice(0, 6).map((n) => n.number);
    onApplyHotSelection(hot6, mostFrequentBonus);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  // Trouver le max pour les barres de progression
  const maxHotCount = hotNumbers[0]?.count || 1;
  const maxColdGap = coldNumbers[0]?.drawsSinceLastDrawn || 1;
  const maxBonusCount = Math.max(...bonusFrequencies.map((b) => b.count), 1);

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden font-sans ${className}`}
    >
      {/* En-tête du Radar Statistique */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Radar Statistique Swiss Lotto
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
              {totalDraws.toLocaleString('fr-CH')} tirages analysés
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Tendances thermiques, écarts maximaux et fréquences des numéros Chance depuis 2013
          </p>
        </div>

        {/* Bouton d'action : Appliquer la sélection Chaude */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApply}
            disabled={hotNumbers.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
              justApplied
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-[#D52B1E] hover:bg-red-700 text-white ring-2 ring-red-400/50'
            }`}
            title="Appliquer les 6 numéros les plus chauds + le Chance le plus fréquent sur votre grille"
          >
            <span className="text-base">{justApplied ? '✓' : '🔥'}</span>
            <span>{justApplied ? 'Sélection chaude (Top 6) appliquée !' : 'Appliquer la sélection Chaude (Top 6)'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Grille principale : Chauds vs Froids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bloc 1 : Top 6 Numéros Chauds (🔥) */}
          <div className="bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 p-4 sm:p-5 rounded-2xl border border-rose-200/60 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-xs">
                  🔥
                </span>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-950">
                  Top 6 Numéros Chauds
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                Plus fréquents
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Les 6 numéros ayant franchi le plus souvent le tirage depuis 2013.
            </p>

            {/* Liste des 6 numéros chauds */}
            <div className="space-y-2 pt-1">
              {hotNumbers.map((item, idx) => {
                const percent = ((item.count / maxHotCount) * 100).toFixed(0);
                return (
                  <div
                    key={item.number}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/90 border border-rose-100 shadow-2xs hover:border-rose-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-rose-400 w-4">#{idx + 1}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs ring-2 ring-red-300"
                        style={{ backgroundColor: SWISS_RED }}
                      >
                        {item.number}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {item.count} sorties
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.frequencyPercentage.toFixed(1)}% des tirages
                        </div>
                      </div>
                    </div>

                    {/* Mini jauge */}
                    <div className="w-20 sm:w-28 space-y-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-[#D52B1E] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloc 2 : Top 6 Numéros Froids (❄️) */}
          <div className="bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-cyan-200/60 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs shadow-xs">
                  ❄️
                </span>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-950">
                  Top 6 Numéros Froids
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
                Plus en retard
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Les 6 numéros dont la dernière sortie est la plus ancienne (écart maximal).
            </p>

            {/* Liste des 6 numéros froids */}
            <div className="space-y-2 pt-1">
              {coldNumbers.map((item, idx) => {
                const percent = ((item.drawsSinceLastDrawn / maxColdGap) * 100).toFixed(0);
                return (
                  <div
                    key={item.number}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/90 border border-sky-100 shadow-2xs hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-sky-400 w-4">#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-white text-xs font-black shadow-xs ring-2 ring-sky-300">
                        {item.number}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {item.drawsSinceLastDrawn} tirages d'écart
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Vu le {formatSwissDate(item.lastDrawnDate)}
                        </div>
                      </div>
                    </div>

                    {/* Mini jauge de retard */}
                    <div className="w-20 sm:w-28 space-y-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bloc 3 : Statistiques Chance (Boules 1 à 6) */}
        <div className="bg-gradient-to-br from-amber-50/60 via-slate-50/70 to-orange-50/40 p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-inner space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs">
                ★
              </span>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                Statistiques Numéro Chance (1 à 6)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Chance N°1 :{' '}
              <strong className="text-amber-700 font-bold">
                Boule {mostFrequentBonus}
              </strong>{' '}
              ({bonusFrequencies.find((b) => b.bonus === mostFrequentBonus)?.count} sorties)
            </span>
          </div>

          {/* Grille 6 colonnes pour les boules Chance */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
            {bonusFrequencies.map((b) => {
              const isTop = b.bonus === mostFrequentBonus;
              const fillPercent = ((b.count / maxBonusCount) * 100).toFixed(0);

              return (
                <div
                  key={b.bonus}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                    isTop
                      ? 'bg-amber-100/90 border-2 border-amber-400 shadow-sm ring-2 ring-amber-300/60 scale-102'
                      : 'bg-white border border-amber-100 shadow-2xs hover:border-amber-300'
                  }`}
                >
                  <div className="relative mb-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        isTop
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                          : 'bg-amber-50 text-slate-800 border border-amber-200'
                      }`}
                    >
                      {b.bonus}
                    </div>
                    {isTop && (
                      <span className="absolute -top-2 -right-2 text-xs text-amber-600" title="Plus fréquent">
                        👑
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-extrabold text-slate-900">
                    {b.count} tirages
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    {b.frequencyPercentage.toFixed(1)}%
                  </div>

                  {/* Jauge verticale ou horizontale */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isTop ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsRadar;

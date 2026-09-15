import React, { useState, useMemo, useEffect } from 'react';
import {
  Clover,
  Dices,
  Flame,
  RotateCcw,
  Snowflake,
  Sparkles,
  Trophy,
  X,
  Award,
  Calendar,
  Share2,
} from 'lucide-react';
import { DrawResult, UserTicket } from './types/lottery';
import {
  calculateLotteryStats,
  calculateSimulation,
  formatCHF,
  formatSwissDate,
} from './utils/calculator';
import { useUrlSync, getUrlTicket } from './hooks/useUrlSync';
import { ShareCard } from './components/ShareCard';
import { trackEvent } from './utils/analytics';
import rawDraws from './data/draws.json';

const draws = rawDraws as DrawResult[];
const minDate = draws[draws.length - 1]?.date || '2013-01-09';
const maxDate = draws[0]?.date || '2026-09-12';

// Encart publicitaire Partenaire inliné
const AdSlot: React.FC<{
  variant?: 'leaderboard' | 'rectangle' | 'responsive';
  label?: string;
  description?: string;
  className?: string;
}> = ({
  variant = 'responsive',
  label = 'Espace Partenaire',
  description,
  className = '',
}) => {
    const getDimensions = () => {
      switch (variant) {
        case 'leaderboard':
          return 'min-h-[84px] sm:min-h-[96px] py-4';
        case 'rectangle':
          return 'min-h-[120px] sm:min-h-[140px] py-6';
        default:
          return 'min-h-[90px] py-5';
      }
    };

    return (
      <div
        role="complementary"
        aria-label={label}
        className={`relative w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white/90 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center px-4 overflow-hidden select-none group ${getDimensions()} ${className}`}
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-bold tracking-wide uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
          <svg
            className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
          <span>{label}</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400 font-medium tracking-tight">
          {description ?? 'Bannière publicitaire • Emplacement réservé'}
        </p>
        <span className="absolute bottom-1.5 right-2.5 text-[9px] uppercase tracking-widest text-slate-300 font-bold">
          Ad
        </span>
      </div>
    );
  };

export const App: React.FC = () => {
  // Grille sélectionnée : hydratée depuis l'URL si params valides, sinon valeurs par défaut
  const [ticket, setTicket] = useState<UserTicket>(() => {
    const urlTicket = getUrlTicket();
    return urlTicket ?? { numbers: [1, 5, 6, 16, 30, 34], bonus: 4 };
  });

  // Date Picker : Date de début et date de fin pour filtrer les tirages
  const [startDate, setStartDate] = useState<string>(minDate);
  const [endDate, setEndDate] = useState<string>(maxDate);

  // Modal pour afficher l'historique complet et le tableau des 8 rangs
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Toggle pour la ShareCard
  const [showShareCard, setShowShareCard] = useState(false);

  const { numbers, bonus } = ticket;
  const isComplete = numbers.length === 6 && bonus !== null;

  // Synchronisation dynamique URL ↔ ticket (deep linking)
  useUrlSync(ticket);

  // 1. Filtrage dynamique des tirages selon la période renseignée
  const filteredDraws = useMemo(() => {
    return draws.filter((d) => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      return true;
    });
  }, [startDate, endDate]);

  // 2. Calcul des statistiques globales sur la période sélectionnée
  // (impacte: Les plus tirés, Les moins tirés, Fréquences chance)
  const stats = useMemo(() => {
    return calculateLotteryStats(filteredDraws);
  }, [filteredDraws]);

  // 3. Simulation des gains en temps réel pour le ticket actuel sur la période sélectionnée
  // (impacte: Gain cumulé, Bilan net, Meilleur gain, Tirages correspondants)
  const simulation = useMemo(() => {
    if (!isComplete) return null;
    return calculateSimulation(numbers, bonus, filteredDraws);
  }, [isComplete, numbers, bonus, filteredDraws]);

  // Analytics : Simulation Réussie
  useEffect(() => {
    if (simulation) {
      trackEvent('Simulation Réussie', { gainNet: simulation.netProfit });
    }
  }, [simulation]);

  // 4. Calcul de la température du ticket (%) sur la période sélectionnée
  // (impacte: Température de grille)
  const hotNumbersSet = useMemo(() => {
    return new Set(stats.hotNumbers.map((n) => n.number));
  }, [stats.hotNumbers]);

  const temperature = useMemo(() => {
    if (numbers.length === 0) return 0;
    const hotCount = numbers.filter((n) => hotNumbersSet.has(n)).length;
    return Math.round((hotCount / Math.max(numbers.length, 1)) * 100);
  }, [numbers, hotNumbersSet]);

  // Numéro le plus chaud et le plus froid parmi ceux choisis par l'utilisateur
  const ticketTrends = useMemo(() => {
    if (numbers.length === 0) {
      return { hottest: null, coldest: null };
    }

    const statsForUserNumbers = numbers.map((num) => {
      const hotStat = stats.hotNumbers.find((n) => n.number === num);
      const coldStat = stats.coldNumbers.find((n) => n.number === num);
      return {
        num,
        count: hotStat?.count ?? 0,
        gap: coldStat?.drawsSinceLastDrawn ?? 0,
      };
    });

    const sortedByCount = [...statsForUserNumbers].sort((a, b) => b.count - a.count);
    const hottest = sortedByCount[0] || null;

    const sortedByGap = [...statsForUserNumbers].sort((a, b) => b.gap - a.gap);
    const coldest = sortedByGap[0] || null;

    return { hottest, coldest };
  }, [numbers, stats]);

  // Bascule d'un numéro principal (max 6)
  const toggleNumber = (num: number) => {
    setTicket((prev) => {
      const exists = prev.numbers.includes(num);
      if (exists) {
        return { ...prev, numbers: prev.numbers.filter((n) => n !== num) };
      }
      if (prev.numbers.length < 6) {
        return { ...prev, numbers: [...prev.numbers, num].sort((a, b) => a - b) };
      }
      return prev;
    });
  };

  // Bascule du numéro Chance (1 à 6)
  const toggleBonus = (b: number) => {
    setTicket((prev) => ({
      ...prev,
      bonus: prev.bonus === b ? null : b,
    }));
  };

  // Tirage chanceux aléatoire (Flash)
  const randomize = () => {
    trackEvent('Bouton Flash');
    const pool = Array.from({ length: 42 }, (_, i) => i + 1);
    const picked: number[] = [];
    while (picked.length < 6) {
      const idx = Math.floor(Math.random() * pool.length);
      const val = pool.splice(idx, 1)[0];
      if (val !== undefined) picked.push(val);
    }
    const randBonus = Math.floor(Math.random() * 6) + 1;
    setTicket({
      numbers: picked.sort((a, b) => a - b),
      bonus: randBonus,
    });
  };

  // Réinitialiser la sélection
  const resetSelection = () => {
    setTicket({ numbers: [], bonus: null });
  };

  // Appliquer la sélection chaude (Top 6 + Chance récurrente de la période)
  const applyHotSelection = () => {
    setTicket({
      numbers: stats.hotNumbers.map((n) => n.number).sort((a, b) => a - b),
      bonus: stats.mostFrequentBonus,
    });
  };

  // 4 derniers tirages correspondants pour le widget d'accueil
  const recentMatches = useMemo(() => {
    if (!simulation) return [];
    return simulation.winningDraws.slice(0, 4);
  }, [simulation]);

  return (
    <div className="min-h-screen bg-[#f7faf7] font-sans text-slate-800">
      {/* 1. Header épuré Lovable */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-lg sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Clover className="size-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  My lucky number
                </h1>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                  Swiss Lotto
                </span>
              </div>
              <p className="text-xs text-slate-500">Votre combinaison face à l’histoire</p>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto text-xs">
            <span className="status-pill">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {filteredDraws.length.toLocaleString('fr-CH')} tirages analysés
            </span>
            <span className="status-pill">
              {startDate.slice(0, 4)} — {endDate.slice(0, 4)}
            </span>
            <span className="hidden text-slate-500 sm:inline font-medium">2.50 CHF / grille</span>
          </div>
        </div>
      </header>

      {/* 2. Corps de page : 3 colonnes à équilibre parfait */}
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-6 xl:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* COLONNE 1 (4 cols) : Sélecteur de Grille                */}
          {/* ======================================================== */}
          <section
            className="panel p-5 sm:p-6 xl:col-span-4 space-y-5"
            aria-labelledby="selection-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">COMPOSEZ VOTRE CHANCE</p>
                <h2 id="selection-title" className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                  Votre grille
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${numbers.length === 6
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {numbers.length} / 6
              </span>
            </div>

            {/* Grille tactile 7 colonnes pour les 42 numéros */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }, (_, index) => index + 1).map((number) => {
                const selected = numbers.includes(number);
                const isLocked = !selected && numbers.length >= 6;

                return (
                  <button
                    key={number}
                    type="button"
                    disabled={isLocked}
                    aria-pressed={selected}
                    aria-label={`Numéro ${number}`}
                    onClick={() => toggleNumber(number)}
                    className={`number-cell cursor-pointer ${selected
                      ? 'number-cell-selected ball-pop'
                      : isLocked
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'number-cell-idle'
                      }`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-slate-100" />

            {/* Section Numéro Chance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">NUMÉRO CHANCE</p>
                  <p className="text-xs text-slate-500">Choisissez 1 numéro (1 à 6)</p>
                </div>
                <Sparkles className="size-5 text-emerald-600" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((number) => {
                  const isSelected = bonus === number;
                  return (
                    <button
                      key={number}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Numéro Chance ${number}`}
                      onClick={() => toggleBonus(number)}
                      className={`chance-cell cursor-pointer ${isSelected
                        ? 'chance-cell-selected ball-pop'
                        : 'number-cell-idle'
                        }`}
                    >
                      {number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Boutons d'actions Tirage chanceux + Reset */}
            <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
              <button
                type="button"
                onClick={randomize}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Dices className="size-4" />
                <span>Tirage chanceux</span>
              </button>

              <button
                type="button"
                aria-label="Réinitialiser la grille"
                title="Réinitialiser"
                onClick={resetSelection}
                disabled={numbers.length === 0 && bonus === null}
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 border border-slate-200/80 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </section>

          {/* ======================================================== */}
          {/* COLONNE 2 (4 cols) : Ticket, Date Picker & Métriques     */}
          {/* ======================================================== */}
          <section
            className="flex flex-col gap-4.5 xl:col-span-4"
            aria-label="Résultat de la grille"
          >
            {/* 1. Carte Ticket Analysé (VERSION LUMINEUSE) */}
            <div className="ticket-panel-light p-5 sm:p-6">
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-emerald-800 font-bold">TICKET ANALYSÉ</p>
                  <span className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                    Chance {bonus ?? '—'}
                  </span>
                </div>

                {/* Les 6 pastilles du ticket */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-2.5">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const num = numbers[index];
                    return (
                      <span
                        key={index}
                        className={num ? 'ticket-ball ball-pop' : 'ticket-ball-empty'}
                      >
                        {num ?? '·'}
                      </span>
                    );
                  })}
                </div>

                <div className="my-4 border-t border-dashed border-emerald-200/80" />

                {/* Métriques clés du ticket */}
                {isComplete && simulation ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Meilleur gain
                      </p>
                      <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {simulation.bestDraw ? formatCHF(simulation.bestDraw.amount) : '0 CHF'}
                      </p>
                      {simulation.bestDraw && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          le {formatSwissDate(simulation.bestDraw.date)}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Tirages gagnants
                      </p>
                      <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                        {simulation.winningDrawsCount}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        sur {filteredDraws.length} tirages
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="py-2 text-center text-xs sm:text-sm text-slate-500">
                    Complétez vos 6 numéros et le numéro Chance pour révéler son histoire.
                  </p>
                )}
              </div>
            </div>

            {/* 2. DATE PICKER AU-DESSUS DES METRICS CARDS */}
            <div className="panel p-4 sm:p-4.5 space-y-3 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      Période d'analyse
                    </h3>
                    <p className="text-[11px] text-slate-500">Filtrer l'historique considéré</p>
                  </div>
                </div>

                <span className="status-pill text-[11px] py-0.5 px-2.5 bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {filteredDraws.length.toLocaleString('fr-CH')} tirages
                </span>
              </div>

              {/* Champs Date début et Date fin */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="start-date" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date de début
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    min={minDate}
                    max={endDate || maxDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="end-date" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date de fin
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate || minDate}
                    max={maxDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Raccourcis temporels rapides */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => { setStartDate(minDate); setEndDate(maxDate); }}
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${startDate === minDate && endDate === maxDate
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                >
                  Tout (2013–2026)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(maxDate);
                    d.setFullYear(d.getFullYear() - 1);
                    setStartDate(d.toISOString().slice(0, 10));
                    setEndDate(maxDate);
                  }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  1 an
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(maxDate);
                    d.setFullYear(d.getFullYear() - 5);
                    setStartDate(d.toISOString().slice(0, 10));
                    setEndDate(maxDate);
                  }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  5 ans
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('2026-01-01');
                    setEndDate(maxDate);
                  }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  2026
                </button>
              </div>
            </div>

            {/* 3. Cartes Gains Cumulés & Bilan Net (METRIC CARDS) */}
            <div className="grid grid-cols-2 gap-4">
              <article className="metric-card">
                <p className="eyebrow">GAINS CUMULÉS</p>
                <p className="metric-value">
                  {simulation ? formatCHF(simulation.totalWinnings) : 'CHF 0.–'}
                </p>
                <p className="metric-note">
                  {simulation ? `${simulation.winningDrawsCount} gains sur ${filteredDraws.length} tirages` : 'En attente...'}
                </p>
              </article>

              <article className="metric-card">
                <p className="eyebrow">BILAN NET</p>
                <p
                  className={`metric-value ${simulation && simulation.netProfit >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                    }`}
                >
                  {simulation ? formatCHF(simulation.netProfit) : 'CHF 0.–'}
                </p>
                <p className="metric-note">
                  {simulation
                    ? `ROI ${simulation.roiPercentage >= 0 ? '+' : ''}${simulation.roiPercentage.toFixed(1)}%`
                    : `2.50 CHF × ${filteredDraws.length} tirages`}
                </p>
              </article>
            </div>

            {/* 5. Bouton Partager + ShareCard collapsible */}
            {isComplete && simulation && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowShareCard((v) => !v)}
                  className={`w-full inline-flex items-center justify-center gap-2.5 rounded-2xl text-sm font-bold px-5 py-3.5 transition-all active:scale-[0.98] cursor-pointer ${showShareCard
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                    }`}
                >
                  <Share2 className="size-4.5" />
                  <span>{showShareCard ? 'Masquer le partage' : 'Partager mon résultat'}</span>
                </button>

                {showShareCard && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                    <ShareCard
                      simulation={simulation}
                      numbers={numbers}
                      bonus={bonus!}
                      startYear={startDate.slice(0, 4)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. Carte Température */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Température de la grille
                  </h3>
                  <p className="text-xs text-slate-500">Affinité avec les numéros chauds sur la période</p>
                </div>
                <span className="text-2xl font-black text-emerald-700">{temperature}%</span>
              </div>

              {/* Jauge de température */}
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${temperature}%` }}
                />
              </div>

              {/* Boîtes de tendance */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="trend-box">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Flame className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Plus chaud</p>
                    <p className="text-sm font-bold text-slate-900">
                      {ticketTrends.hottest ? `${ticketTrends.hottest.num} · ${ticketTrends.hottest.count}×` : '—'}
                    </p>
                  </div>
                </div>

                <div className="trend-box">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Snowflake className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Plus froid</p>
                    <p className="text-sm font-bold text-slate-900">
                      {ticketTrends.coldest ? `${ticketTrends.coldest.num} · ${ticketTrends.coldest.gap} tirages` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* COLONNE 3 (4 cols) : Chaud ou Froid & Tirages Passés     */}
          {/* ======================================================== */}
          <section
            className="flex flex-col gap-5 xl:col-span-4"
            aria-label="Statistiques et historique"
          >
            {/* Carte Chaud ou Froid ? */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Chaud ou froid ?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tendances sur la période ({filteredDraws.length} tirages)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyHotSelection}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  title="Appliquer le Top 6 chaud de cette période sur votre grille"
                >
                  Appliquer le Top 6
                </button>
              </div>

              {/* Les plus tirés (Top 6 Chauds sur la période) */}
              <div>
                <p className="eyebrow flex items-center gap-1.5 text-rose-600">
                  <Flame className="size-3.5" />
                  <span>LES PLUS TIRÉS (TOP 6)</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {stats.hotNumbers.map((item) => (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => toggleNumber(item.number)}
                      className={`stat-ball stat-ball-hot cursor-pointer ${numbers.includes(item.number) ? 'ring-2 ring-rose-500 ring-offset-1' : ''
                        }`}
                      title={`${item.number} : tiré ${item.count} fois (${item.frequencyPercentage.toFixed(1)}%) sur cette période`}
                    >
                      {item.number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Les moins tirés (Top 6 Froids sur la période) */}
              <div>
                <p className="eyebrow flex items-center gap-1.5 text-sky-600">
                  <Snowflake className="size-3.5" />
                  <span>LES MOINS TIRÉS (PLUS EN RETARD)</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {stats.coldNumbers.map((item) => (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => toggleNumber(item.number)}
                      className={`stat-ball stat-ball-cold cursor-pointer ${numbers.includes(item.number) ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                        }`}
                      title={`${item.number} : absent depuis ${item.drawsSinceLastDrawn} tirages sur cette période`}
                    >
                      {item.number}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Carte Tirages correspondants dans le passé sur la période */}
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="eyebrow">VOTRE COMBINAISON DANS LE PASSÉ</p>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
                    Tirages correspondants
                  </h3>
                </div>
                <Trophy className="size-5 text-emerald-600" aria-hidden="true" />
              </div>

              <div className="divide-y divide-slate-100">
                {recentMatches.length > 0 ? (
                  recentMatches.map((match) => (
                    <article
                      key={match.id}
                      className="px-5 py-3.5 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {formatSwissDate(match.date)}
                          </p>
                          <p className="text-xs text-slate-500">{match.rankLabel}</p>
                        </div>
                        <p className="text-sm font-black text-emerald-600">
                          + {formatCHF(match.amount)}
                        </p>
                      </div>

                      {/* Numéros trouvés */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {match.matchedNumbers.map((n) => (
                          <span key={n} className="history-ball">
                            {n}
                          </span>
                        ))}
                        {match.matchedBonus && (
                          <span
                            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title="Chance trouvée !"
                          >
                            Chance {match.drawBonus} ★
                          </span>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 px-4">
                    <p className="text-xs sm:text-sm">
                      {isComplete
                        ? 'Aucun tirage gagnant répertorié sur la période sélectionnée.'
                        : 'Complétez votre grille pour afficher les tirages correspondants.'}
                    </p>
                  </div>
                )}
              </div>

              {simulation && simulation.winningDraws.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 py-2.5 px-4 border border-dashed border-slate-200 transition-all cursor-pointer"
                  >
                    Voir tout l’historique ({simulation.winningDraws.length} tirages) &amp; rangs
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 3. Emplacement publicitaire discret Partenaire */}
        <div className="pt-2">
          <AdSlot
            variant="leaderboard"
            label="Espace Partenaire"
            description="Bannière Leaderboard • Emplacement partenaire réservé"
            className="bg-white/80"
          />
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL : HISTORIQUE COMPLET & TABLEAU DES 8 RANGS         */}
      {/* ======================================================== */}
      {showAllHistory && simulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Historique &amp; Répartition des gains
                  </h3>
                  <p className="text-xs text-slate-500">
                    {simulation.winningDrawsCount} tirages gagnants répertoriés (du {formatSwissDate(startDate)} au {formatSwissDate(endDate)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllHistory(false)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Tableau des rangs de gain */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Répartition des victoires par rang
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Rang</th>
                        <th className="px-3 py-2.5">Combinaison</th>
                        <th className="px-3 py-2.5 text-center">Victoires</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulation.rankStats.map(({ definition, count, totalAmount }) => (
                        <tr
                          key={definition.key}
                          className={count > 0 ? 'bg-emerald-50/40 font-semibold' : ''}
                        >
                          <td className="px-4 py-2.5 text-slate-900">{definition.label}</td>
                          <td className="px-3 py-2.5 text-slate-500">{definition.shortLabel}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${count > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-slate-400'
                                }`}
                            >
                              {count}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                            {totalAmount > 0 ? formatCHF(totalAmount) : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tous les tirages gagnants */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Tous les tirages correspondants ({simulation.winningDraws.length})
                </h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {simulation.winningDraws.map((match) => (
                    <div
                      key={match.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">
                          {formatSwissDate(match.date)}
                        </span>{' '}
                        <span className="text-slate-400">•</span>{' '}
                        <span className="text-slate-600">{match.rankLabel}</span>
                        <div className="mt-1 flex gap-1">
                          {match.matchedNumbers.map((n) => (
                            <span
                              key={n}
                              className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right font-black text-emerald-600 text-sm">
                        +{formatCHF(match.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setShowAllHistory(false)}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

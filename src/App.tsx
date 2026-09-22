import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { DrawResult, UserTicket } from './types/lottery';
import {
  calculateLotteryStats,
  calculateSimulation,
  formatCHF,
} from './utils/calculator';
import {
  EuromillionsUserTicket,
} from './types/euromillions';
import {
  calculateEuromillionsSimulation,
  calculateEuromillionsStats,
  formatEUR,
} from './utils/euromillionsCalculator';
import { useEuromillionsHistory } from './hooks/useEuromillionsHistory';
import {
  LotteryGame,
  getUrlGameMode,
  getUrlSwissTicket,
  getUrlEuromillionsTicket,
  useMultiLotteryUrlSync,
} from './hooks/useUrlSync';
import { EtfComparison } from './components/EtfComparison';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ShareModal } from './components/ShareModal';
import { ShareTriggerModal } from './components/ShareTriggerModal';
import { SeoContent } from './components/SeoContent';
import { Footer } from './components/Footer';
import { useI18n } from './i18n/I18nContext';
import { trackEvent } from './utils/analytics';
import rawDraws from './data/draws.json';

const swissRawDraws = rawDraws as DrawResult[];

// Encart publicitaire Partenaire inliné
const AdSlot: React.FC<{
  variant?: 'leaderboard' | 'rectangle' | 'responsive';
  label?: string;
  description?: string;
  className?: string;
}> = ({
  variant = 'responsive',
  label,
  description,
  className = '',
}) => {
  const { t } = useI18n();
  const displayLabel = label ?? t('adSlot.partnerSpace');
  const displayDescription = description ?? t('adSlot.leaderboard');

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
      aria-label={displayLabel}
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
        <span>{displayLabel}</span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400 font-medium tracking-tight">
        {displayDescription}
      </p>
      <span className="absolute bottom-1.5 right-2.5 text-[9px] uppercase tracking-widest text-slate-300 font-bold">
        Ad
      </span>
    </div>
  );
};

export const App: React.FC = () => {
  const { t, language, formatDate, getRankLabel, emCostPerDraw, emCurrency } = useI18n();

  // Mode de jeu sélectionné via le select : Swiss Lotto ou EuroMillions
  const [gameMode, setGameMode] = useState<LotteryGame>(getUrlGameMode);

  // Synchronise l'attribut data-game sur <body> pour le thème CSS
  useEffect(() => {
    document.body.setAttribute('data-game', gameMode);
    return () => { document.body.removeAttribute('data-game'); };
  }, [gameMode]);

  // 1. Swiss Lotto State
  const [swissTicket, setSwissTicket] = useState<UserTicket>(() => {
    const urlTicket = getUrlSwissTicket();
    return urlTicket ?? { numbers: [1, 5, 6, 16, 30, 34], bonus: 4 };
  });
  const swissMinDate = swissRawDraws[swissRawDraws.length - 1]?.date || '2013-01-09';
  const swissMaxDate = swissRawDraws[0]?.date || '2026-09-12';
  const [swissStartDate, setSwissStartDate] = useState<string>(swissMinDate);
  const [swissEndDate, setSwissEndDate] = useState<string>(swissMaxDate);

  // 2. EuroMillions State (chargement depuis le JSON unifié)
  const { draws: emRawDraws } = useEuromillionsHistory();
  const [emTicket, setEmTicket] = useState<EuromillionsUserTicket>(() => {
    const urlEmTicket = getUrlEuromillionsTicket();
    return urlEmTicket ?? { numbers: [16, 29, 32, 36, 41], stars: [7, 9] };
  });
  const emMinDate = emRawDraws.length > 0 ? emRawDraws[emRawDraws.length - 1].d : '2004-02-13';
  const emMaxDate = emRawDraws.length > 0 ? emRawDraws[0].d : '2026-09-15';
  const [emStartDate, setEmStartDate] = useState<string>('2004-02-13');
  const [emEndDate, setEmEndDate] = useState<string>('2026-09-15');

  useEffect(() => {
    if (emRawDraws.length > 0) {
      setEmStartDate(emRawDraws[emRawDraws.length - 1].d);
      setEmEndDate(emRawDraws[0].d);
    }
  }, [emRawDraws]);

  // Synchronisation dynamique avec l'URL selon le jeu sélectionné
  useMultiLotteryUrlSync({
    game: gameMode,
    swissTicket,
    emTicket,
  });

  // Modal pour afficher l'historique complet et le tableau des rangs
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Modale de partage
  const [showShareModal, setShowShareModal] = useState(false);

  // Modale d'incitation au partage (à la 3e simulation réussie)
  const [showShareTrigger, setShowShareTrigger] = useState(false);
  const simCountRef = useRef<number>((() => {
    try {
      const val = parseInt(sessionStorage.getItem('simulations_count') || '0', 10);
      return Number.isNaN(val) || val < 0 ? 0 : val;
    } catch {
      return 0;
    }
  })());

  // Valeurs courantes selon le jeu actif
  const numbers = gameMode === 'swisslotto' ? swissTicket.numbers : emTicket.numbers;
  const isComplete =
    gameMode === 'swisslotto'
      ? swissTicket.numbers.length === 6 && swissTicket.bonus !== null
      : emTicket.numbers.length === 5 && emTicket.stars.length === 2;

  const minDate = gameMode === 'swisslotto' ? swissMinDate : emMinDate;
  const maxDate = gameMode === 'swisslotto' ? swissMaxDate : emMaxDate;
  const startDate = gameMode === 'swisslotto' ? swissStartDate : emStartDate;
  const endDate = gameMode === 'swisslotto' ? swissEndDate : emEndDate;

  const setStartDate = (dateStr: string) => {
    if (gameMode === 'swisslotto') {
      setSwissStartDate(dateStr);
    } else {
      setEmStartDate(dateStr);
    }
  };

  const setEndDate = (dateStr: string) => {
    if (gameMode === 'swisslotto') {
      setSwissEndDate(dateStr);
    } else {
      setEmEndDate(dateStr);
    }
  };

  // Filtrage des tirages historiques selon la période
  const filteredSwissDraws = useMemo(() => {
    return swissRawDraws.filter((d) => {
      if (swissStartDate && d.date < swissStartDate) return false;
      if (swissEndDate && d.date > swissEndDate) return false;
      return true;
    });
  }, [swissStartDate, swissEndDate]);

  const filteredEmDraws = useMemo(() => {
    return emRawDraws.filter((d) => {
      if (emStartDate && d.d < emStartDate) return false;
      if (emEndDate && d.d > emEndDate) return false;
      return true;
    });
  }, [emRawDraws, emStartDate, emEndDate]);

  const filteredDraws = gameMode === 'swisslotto' ? filteredSwissDraws : filteredEmDraws;

  // Calcul des statistiques
  const swissStats = useMemo(() => {
    return calculateLotteryStats(filteredSwissDraws);
  }, [filteredSwissDraws]);

  const emStats = useMemo(() => {
    return calculateEuromillionsStats(filteredEmDraws);
  }, [filteredEmDraws]);

  // Simulation rétrospective en temps réel
  const swissSimulation = useMemo(() => {
    if (swissTicket.numbers.length !== 6 || swissTicket.bonus === null) return null;
    return calculateSimulation(swissTicket.numbers, swissTicket.bonus, filteredSwissDraws);
  }, [swissTicket.numbers, swissTicket.bonus, filteredSwissDraws]);

  const emSimulation = useMemo(() => {
    if (emTicket.numbers.length !== 5 || emTicket.stars.length !== 2) return null;
    return calculateEuromillionsSimulation(
      emTicket.numbers,
      emTicket.stars,
      filteredEmDraws,
      emCostPerDraw,
      emCurrency
    );
  }, [emTicket.numbers, emTicket.stars, filteredEmDraws, emCostPerDraw, emCurrency]);

  const simulation = gameMode === 'swisslotto' ? swissSimulation : emSimulation;
  // Swiss Lotto = always CHF ; EuroMillions = CHF (Suisse) ou EUR (France/intl) selon la locale
  const currency: 'CHF' | 'EUR' = gameMode === 'swisslotto' ? 'CHF' : emCurrency;
  const formatAmount = currency === 'CHF' ? formatCHF : formatEUR;

  // Analytics : Simulation réussie anti doublon strict-mode
  const currentTicketKey =
    gameMode === 'swisslotto'
      ? (isComplete ? `swiss-${swissTicket.numbers.join(',')}-${swissTicket.bonus}` : '')
      : (isComplete ? `em-${emTicket.numbers.join(',')}-${emTicket.stars.join(',')}` : '');

  const prevTicketKeyRef = useRef<string>('');

  useEffect(() => {
    if (!isComplete || !simulation) return;

    if (currentTicketKey && currentTicketKey !== prevTicketKeyRef.current) {
      prevTicketKeyRef.current = currentTicketKey;

      trackEvent('Simulation réussie', {
        game: gameMode,
        gainNet: simulation.netProfit,
      });

      simCountRef.current += 1;
      try {
        sessionStorage.setItem('simulations_count', String(simCountRef.current));
      } catch {
        // ignore
      }

      if (simCountRef.current === 3) {
        const hasTriggered = sessionStorage.getItem('share_trigger_shown');
        if (!hasTriggered) {
          setShowShareTrigger(true);
          try {
            sessionStorage.setItem('share_trigger_shown', '1');
          } catch {
            // ignore
          }
          trackEvent('Affichage trigger share modal', { gridCount: 3 });
        }
      }
    }
  }, [currentTicketKey, isComplete, simulation, gameMode]);

  // Actions de sélection des numéros
  const toggleNumber = (num: number) => {
    if (gameMode === 'swisslotto') {
      const cur = swissTicket.numbers;
      if (cur.includes(num)) {
        setSwissTicket({ ...swissTicket, numbers: cur.filter((n) => n !== num) });
      } else if (cur.length < 6) {
        setSwissTicket({ ...swissTicket, numbers: [...cur, num].sort((a, b) => a - b) });
      }
    } else {
      const cur = emTicket.numbers;
      if (cur.includes(num)) {
        setEmTicket({ ...emTicket, numbers: cur.filter((n) => n !== num) });
      } else if (cur.length < 5) {
        setEmTicket({ ...emTicket, numbers: [...cur, num].sort((a, b) => a - b) });
      }
    }
  };

  const toggleBonus = (bonusNum: number) => {
    setSwissTicket({
      ...swissTicket,
      bonus: swissTicket.bonus === bonusNum ? null : bonusNum,
    });
  };

  const toggleStar = (starNum: number) => {
    const cur = emTicket.stars;
    if (cur.includes(starNum)) {
      setEmTicket({ ...emTicket, stars: cur.filter((s) => s !== starNum) });
    } else if (cur.length < 2) {
      setEmTicket({ ...emTicket, stars: [...cur, starNum].sort((a, b) => a - b) });
    }
  };

  // Flash aléatoire (Bouton Flash)
  const randomize = () => {
    trackEvent('Bouton Flash', { game: gameMode });
    if (gameMode === 'swisslotto') {
      const all = Array.from({ length: 42 }, (_, i) => i + 1);
      const shuffled = all.sort(() => 0.5 - Math.random());
      const randBonus = Math.floor(Math.random() * 6) + 1;
      setSwissTicket({
        numbers: shuffled.slice(0, 6).sort((a, b) => a - b),
        bonus: randBonus,
      });
    } else {
      const all = Array.from({ length: 50 }, (_, i) => i + 1);
      const shuffled = all.sort(() => 0.5 - Math.random());
      const allStars = Array.from({ length: 12 }, (_, i) => i + 1);
      const shuffledStars = allStars.sort(() => 0.5 - Math.random());
      setEmTicket({
        numbers: shuffled.slice(0, 5).sort((a, b) => a - b),
        stars: shuffledStars.slice(0, 2).sort((a, b) => a - b),
      });
    }
  };

  // Réinitialiser la sélection
  const resetSelection = () => {
    if (gameMode === 'swisslotto') {
      setSwissTicket({ numbers: [], bonus: null });
    } else {
      setEmTicket({ numbers: [], stars: [] });
    }
  };

  // Appliquer la sélection chaude
  const applyHotSelection = () => {
    if (gameMode === 'swisslotto') {
      setSwissTicket({
        numbers: swissStats.hotNumbers.map((n) => n.number).sort((a, b) => a - b),
        bonus: swissStats.mostFrequentBonus,
      });
    } else {
      setEmTicket({
        numbers: emStats.hotNumbers.map((n) => n.value).sort((a, b) => a - b),
        stars: emStats.hotStars.slice(0, 2).map((s) => s.value).sort((a, b) => a - b),
      });
    }
  };

  // 4 derniers tirages correspondants pour le widget d'accueil
  const recentMatches = useMemo(() => {
    if (!simulation) return [];
    return simulation.winningDraws.slice(0, 4);
  }, [simulation]);

  return (
    <div className="min-h-screen bg-[#f7faf7] font-sans text-slate-800">
      {/* 1. Header épuré avec sélecteur de Loto */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-lg sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Clover className="size-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {t('header.title')}
                </h1>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                  {gameMode === 'swisslotto' ? 'Swiss Lotto' : 'EuroMillions'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {gameMode === 'swisslotto'
                  ? 'Simulateur rétrospectif officiel de vos numéros (depuis 2013)'
                  : "Vos numéros fétiches face à l'histoire officielle depuis 2004"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap sm:flex-nowrap">
            {/* SELECTEUR DU JEU – pill coloré affordant */}
            <div className="lottery-switcher">
              <select
                id="lottery-select"
                aria-label="Sélectionner le loto"
                value={gameMode}
                onChange={(e) => {
                  const next = e.target.value as LotteryGame;
                  setGameMode(next);
                  trackEvent('Changement de jeu', { game: next });
                }}
                className={`lottery-switcher-select ${gameMode === 'swisslotto' ? 'theme-swiss' : 'theme-em'}`}
              >
                <option value="swisslotto">🇨🇭 Swiss Lotto</option>
                <option value="euromillions">🇪🇺 EuroMillions</option>
              </select>
              <ChevronDown className="size-3.5 lottery-switcher-icon" />
            </div>

            <span className="status-pill">
              <span className={`size-2 rounded-full animate-pulse ${gameMode === 'swisslotto' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              {t('header.drawsAnalyzed', {
                count: filteredDraws.length.toLocaleString(
                  language === 'de' ? 'de-CH' : language === 'en' ? 'en-CH' : 'fr-CH'
                ),
              })}
            </span>
            <span className="status-pill">
              {startDate.slice(0, 4)} — {endDate.slice(0, 4)}
            </span>
            <span className="hidden text-slate-500 sm:inline font-medium">
              {gameMode === 'swisslotto'
                ? '2,50 CHF / grille'
                : `${emCostPerDraw.toFixed(2).replace('.', ',')} ${emCurrency === 'EUR' ? '€' : 'CHF'} / grille`}
            </span>
            <LanguageSwitcher />
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
                <p className="eyebrow">{t('grid.eyebrow')}</p>
                <h2 id="selection-title" className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                  {gameMode === 'swisslotto' ? 'Choisissez 6 numéros' : 'Choisissez 5 numéros'}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  (gameMode === 'swisslotto' && numbers.length === 6) ||
                  (gameMode === 'euromillions' && numbers.length === 5)
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {numbers.length} / {gameMode === 'swisslotto' ? 6 : 5}
              </span>
            </div>

            {/* Grille principale des numéros (7 colonnes originales) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{t('grid.mainLabel')}</span>
                <span>{gameMode === 'swisslotto' ? '(choisir 6 numéros)' : '(choisir 5 numéros)'}</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from(
                  { length: gameMode === 'swisslotto' ? 42 : 50 },
                  (_, i) => i + 1
                ).map((number) => {
                  const isSelected = numbers.includes(number);
                  return (
                    <button
                      key={number}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Numéro ${number}`}
                      onClick={() => toggleNumber(number)}
                      className={`number-cell cursor-pointer ${
                        isSelected ? 'number-cell-selected ball-pop' : 'number-cell-idle'
                      }`}
                    >
                      {number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Numéro Chance (Swiss Lotto) OU Étoiles (EuroMillions) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {gameMode === 'swisslotto' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="eyebrow">NUMÉRO CHANCE</p>
                      <p className="text-xs text-slate-500 font-medium">
                        Choisissez 1 numéro (1 à 6)
                      </p>
                    </div>
                    <Sparkles className="size-5 text-emerald-600" aria-hidden="true" />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((number) => {
                      const isSelected = swissTicket.bonus === number;
                      return (
                        <button
                          key={number}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={`Chance ${number}`}
                          onClick={() => toggleBonus(number)}
                          className={`chance-cell cursor-pointer ${
                            isSelected ? 'chance-cell-selected ball-pop' : 'number-cell-idle'
                          }`}
                        >
                          {number}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="eyebrow">ÉTOILES CHANCE</p>
                      <p className="text-xs text-slate-500 font-medium">
                        Choisissez 2 étoiles (1 à 12)
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors ${
                        emTicket.stars.length === 2
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {emTicket.stars.length} / 2 ★
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((starNum) => {
                      const isSelected = emTicket.stars.includes(starNum);
                      return (
                        <button
                          key={starNum}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={`Étoile ${starNum}`}
                          onClick={() => toggleStar(starNum)}
                          className={`chance-cell cursor-pointer ${
                            isSelected ? 'chance-cell-selected ball-pop' : 'number-cell-idle'
                          }`}
                        >
                          {starNum} ★
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Boutons d'actions Tirage chanceux (Flash) + Reset */}
            <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
              <button
                type="button"
                onClick={randomize}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Dices className="size-4" />
                <span>{t('grid.flash')}</span>
              </button>

              <button
                type="button"
                aria-label={t('grid.reset')}
                title={t('grid.reset')}
                onClick={resetSelection}
                disabled={
                  gameMode === 'swisslotto'
                    ? swissTicket.numbers.length === 0 && swissTicket.bonus === null
                    : emTicket.numbers.length === 0 && emTicket.stars.length === 0
                }
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
                  <p className="eyebrow text-emerald-800 font-bold">{t('ticketCard.eyebrow')}</p>
                  <span className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                    {gameMode === 'swisslotto'
                      ? `Chance ${swissTicket.bonus ?? '—'}`
                      : `★ ${emTicket.stars.length > 0 ? emTicket.stars.join('  ★ ') : '—'}`}
                  </span>
                </div>

                {/* Pastilles du ticket */}
                {gameMode === 'swisslotto' ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-2.5">
                    {Array.from({ length: 6 }).map((_, index) => {
                      const num = swissTicket.numbers[index];
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
                ) : (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-2.5 items-center">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const num = emTicket.numbers[index];
                      return (
                        <span
                          key={index}
                          className={num ? 'ticket-ball ball-pop' : 'ticket-ball-empty'}
                        >
                          {num ?? '·'}
                        </span>
                      );
                    })}
                    <span className="text-slate-300 font-bold px-1">+</span>
                    {Array.from({ length: 2 }).map((_, index) => {
                      const star = emTicket.stars[index];
                      return (
                        <span
                          key={`star-${index}`}
                          className={
                            star
                              ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm sm:text-base bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30 border border-amber-300 ball-pop'
                              : 'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm sm:text-base bg-white/60 border border-dashed border-amber-300/80 text-amber-400/60'
                          }
                        >
                          {star ? `★${star}` : '★'}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="my-4 border-t border-dashed border-emerald-200/80" />

                {/* Métriques clés du ticket */}
                {isComplete && simulation ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('ticketCard.bestWin')}
                      </p>
                      <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {simulation.bestDraw ? formatAmount(simulation.bestDraw.amount) : formatAmount(0)}
                      </p>
                      {simulation.bestDraw && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {t('ticketCard.onDate', { date: formatDate(simulation.bestDraw.date) })}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('ticketCard.winningDraws')}
                      </p>
                      <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                        {simulation.winningDrawsCount}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('ticketCard.onDraws', { count: filteredDraws.length })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="py-2 text-center text-xs sm:text-sm text-slate-500">
                    {gameMode === 'swisslotto'
                      ? 'Complétez vos 6 numéros et le numéro Chance pour révéler son histoire.'
                      : 'Complétez vos 5 numéros et vos 2 étoiles pour révéler leur histoire.'}
                  </p>
                )}
              </div>
            </div>

            {/* 2. DATE PICKER */}
            <div className="panel p-4 sm:p-4.5 space-y-3 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {t('ticketCard.periodTitle')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('ticketCard.periodSub')}</p>
                  </div>
                </div>

                <span className="status-pill text-[11px] py-0.5 px-2.5 bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t('header.drawsAnalyzed', {
                    count: filteredDraws.length.toLocaleString(
                      language === 'de' ? 'de-CH' : language === 'en' ? 'en-CH' : 'fr-CH'
                    ),
                  })}
                </span>
              </div>

              {/* Champs Date début et Date fin */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="start-date" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('ticketCard.startDate')}
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
                    {t('ticketCard.endDate')}
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

              {/* Raccourcis de période */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">{t('ticketCard.shortcuts')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(minDate);
                    setEndDate(maxDate);
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                    startDate === minDate && endDate === maxDate
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {gameMode === 'swisslotto' ? 'Tout (2013–2026)' : 'Tout (2004–2026)'}
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
                  {t('ticketCard.oneYear')}
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
                  {t('ticketCard.fiveYears')}
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
                <p className="eyebrow">{t('metrics.totalWinnings')}</p>
                <p className="metric-value">
                  {simulation ? formatAmount(simulation.totalWinnings) : `${currency} 0.–`}
                </p>
                <p className="metric-note">
                  {simulation
                    ? t('metrics.winningsNote', { wins: simulation.winningDrawsCount, total: filteredDraws.length })
                    : t('metrics.waiting')}
                </p>
              </article>

              <article className="metric-card">
                <p className="eyebrow">{t('metrics.netProfit')}</p>
                <p
                  className={`metric-value ${
                    simulation && simulation.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {simulation ? formatAmount(simulation.netProfit) : `${currency} 0.–`}
                </p>
                <p className="metric-note">
                  {simulation
                    ? t('metrics.roi', {
                        value: (simulation.roiPercentage >= 0 ? '+' : '') + simulation.roiPercentage.toFixed(1),
                      })
                    : t('metrics.investedNote', { count: filteredDraws.length })}
                </p>
              </article>
            </div>

            {/* 4. Bouton Partager mon résultat */}
            {isComplete && simulation && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl text-sm font-bold px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Share2 className="size-4.5" />
                <span>{t('ticketCard.shareButton')}</span>
              </button>
            )}
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
                    {t('stats.title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('stats.subtitle', { count: filteredDraws.length })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyHotSelection}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  title={gameMode === 'swisslotto' ? 'Appliquer le Top 6' : 'Appliquer le Top 5 + 2★'}
                >
                  {gameMode === 'swisslotto' ? 'Appliquer le Top 6' : 'Appliquer le Top 5 + 2★'}
                </button>
              </div>

              {/* Les plus tirés (Chauds sur la période) */}
              <div>
                <p className="eyebrow flex items-center gap-1.5 text-rose-600">
                  <Flame className="size-3.5" />
                  <span>{gameMode === 'swisslotto' ? 'LES PLUS TIRÉS (TOP 6)' : 'LES PLUS TIRÉS (TOP 5)'}</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {gameMode === 'swisslotto'
                    ? swissStats.hotNumbers.map((item) => (
                        <button
                          key={item.number}
                          type="button"
                          onClick={() => toggleNumber(item.number)}
                          className={`stat-ball stat-ball-hot cursor-pointer ${
                            swissTicket.numbers.includes(item.number) ? 'ring-2 ring-rose-500 ring-offset-1' : ''
                          }`}
                          title={`${item.number} : tiré ${item.count} fois (${item.frequencyPercentage.toFixed(1)}%)`}
                        >
                          {item.number}
                        </button>
                      ))
                    : emStats.hotNumbers.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => toggleNumber(item.value)}
                          className={`stat-ball stat-ball-hot cursor-pointer ${
                            emTicket.numbers.includes(item.value) ? 'ring-2 ring-rose-500 ring-offset-1' : ''
                          }`}
                          title={`${item.value} : tiré ${item.count} fois (${item.frequencyPercentage.toFixed(1)}%)`}
                        >
                          {item.value}
                        </button>
                      ))}
                </div>
              </div>

              {/* Les moins tirés (Froids sur la période) */}
              <div>
                <p className="eyebrow flex items-center gap-1.5 text-sky-600">
                  <Snowflake className="size-3.5" />
                  <span>{gameMode === 'swisslotto' ? 'LES MOINS TIRÉS (TOP 6)' : 'LES MOINS TIRÉS (TOP 5)'}</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {gameMode === 'swisslotto'
                    ? swissStats.coldNumbers.map((item) => (
                        <button
                          key={item.number}
                          type="button"
                          onClick={() => toggleNumber(item.number)}
                          className={`stat-ball stat-ball-cold cursor-pointer ${
                            swissTicket.numbers.includes(item.number) ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                          }`}
                          title={`${item.number} : absent depuis ${item.drawsSinceLastDrawn} tirages`}
                        >
                          {item.number}
                        </button>
                      ))
                    : emStats.coldNumbers.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => toggleNumber(item.value)}
                          className={`stat-ball stat-ball-cold cursor-pointer ${
                            emTicket.numbers.includes(item.value) ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                          }`}
                          title={`${item.value} : absent depuis ${item.drawsSinceLastDrawn} tirages`}
                        >
                          {item.value}
                        </button>
                      ))}
                </div>
              </div>

              {/* Étoiles les plus fréquentes (EuroMillions uniquement) */}
              {gameMode === 'euromillions' && (
                <div>
                  <p className="eyebrow flex items-center gap-1.5 text-amber-700">
                    <Sparkles className="size-3.5" />
                    <span>ÉTOILES LES PLUS TIRÉES</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {emStats.hotStars.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleStar(item.value)}
                        className={`stat-ball cursor-pointer ${
                          emTicket.stars.includes(item.value)
                            ? 'bg-amber-500 border-amber-600 text-white font-black ring-2 ring-amber-500 ring-offset-1'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                        title={`Étoile ${item.value} : tirée ${item.count} fois`}
                      >
                        {item.value} ★
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Carte Tirages correspondants dans le passé sur la période */}
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="eyebrow">{t('history.eyebrow')}</p>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
                    {t('history.title')}
                  </h3>
                </div>
                <Trophy className="size-5 text-emerald-600" aria-hidden="true" />
              </div>

              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {recentMatches.length > 0 ? (
                  recentMatches.map((match: any, idx) => (
                    <article
                      key={`${match.date}-${idx}`}
                      className="px-5 py-3.5 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {formatDate(match.date)}
                          </p>
                          <p className="text-xs text-slate-500">{match.rankLabel}</p>
                        </div>
                        <p className="text-sm font-black text-emerald-600">
                          + {formatAmount(match.amount)}
                        </p>
                      </div>

                      {/* Numéros & chance/étoiles trouvés */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {match.matchedNumbers.map((n: number) => (
                          <span key={n} className="history-ball">
                            {n}
                          </span>
                        ))}
                        {match.matchedBonus !== undefined && match.matchedBonus && (
                          <span
                            className="history-ball-chance"
                            title={t('history.chanceFoundTitle')}
                          >
                            Chance {match.drawBonus} ★
                          </span>
                        )}
                        {match.matchedStars &&
                          match.matchedStars.map((s: number) => (
                            <span
                              key={s}
                              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                              title={t('history.chanceFoundTitle')}
                            >
                              ★ {s}
                            </span>
                          ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 px-4">
                    <p className="text-xs sm:text-sm">
                      {isComplete ? t('history.noMatch') : t('history.incomplete')}
                    </p>
                  </div>
                )}
              </div>

              {/* Bouton pour ouvrir la modale d'historique complet */}
              {simulation && simulation.winningDraws.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 py-2.5 px-4 border border-dashed border-slate-200 transition-all cursor-pointer"
                  >
                    {t('history.viewAll', { count: simulation.winningDraws.length })}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Section ETF pleine largeur sous la grille */}
        {isComplete && simulation && (
          <EtfComparison
            simulation={simulation}
            filteredDraws={filteredDraws}
            currency={currency}
            costPerDraw={gameMode === 'swisslotto' ? 2.5 : emCostPerDraw}
            gameLabel={gameMode === 'swisslotto' ? 'Swiss Lotto' : 'EuroMillions'}
          />
        )}

        {/* 3. Emplacement publicitaire discret Partenaire */}
        <div className="pt-2">
          <AdSlot variant="leaderboard" className="bg-white/80" />
        </div>
      </main>

      {/* 4. Contenu textuel éducatif & FAQ SEO (Indexation Google) */}
      <SeoContent />

      {/* 5. Footer */}
      <Footer />

      {/* ======================================================== */}
      {/* MODAL : HISTORIQUE COMPLET ET TABLEAU DES RANGS         */}
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
                    {gameMode === 'swisslotto'
                      ? 'Historique & Répartition des 8 rangs'
                      : 'Historique & Répartition des 13 rangs'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('modalHistory.subtitle', {
                      count: simulation.winningDrawsCount,
                      start: formatDate(startDate),
                      end: formatDate(endDate),
                    })}
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
                  {t('modalHistory.rankTitle')}
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">{t('modalHistory.rankCol')}</th>
                        <th className="px-3 py-2.5">{t('modalHistory.comboCol')}</th>
                        <th className="px-3 py-2.5 text-center">{t('modalHistory.winsCol')}</th>
                        <th className="px-4 py-2.5 text-right">{t('modalHistory.totalCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulation.rankStats.map((item: any, idx: number) => (
                        <tr
                          key={item.definition.key}
                          className={item.count > 0 ? 'bg-emerald-50/40 font-semibold' : 'text-slate-400'}
                        >
                          <td className="px-4 py-2 text-slate-700 font-medium">
                            Rang {idx + 1}
                          </td>
                          <td className="px-3 py-2 text-slate-900">
                            {getRankLabel(item.definition.key)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.count > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                {item.count}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {item.totalAmount > 0 ? (
                              <span className="text-emerald-700 font-bold">
                                {formatAmount(item.totalAmount)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tous les tirages correspondants */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {t('modalHistory.allDrawsTitle', { count: simulation.winningDraws.length })}
                </h4>
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {simulation.winningDraws.map((wDraw: any, index: number) => (
                    <div
                      key={`${wDraw.date}-${index}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {formatDate(wDraw.date)}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold">
                            {wDraw.rankLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {wDraw.matchedNumbers.map((n: number) => (
                            <span key={n} className="history-ball text-[11px]">
                              {n}
                            </span>
                          ))}
                          {wDraw.matchedBonus !== undefined && wDraw.matchedBonus && (
                            <span className="history-ball-chance text-[11px]">
                              Chance {wDraw.drawBonus} ★
                            </span>
                          )}
                          {wDraw.matchedStars &&
                            wDraw.matchedStars.map((s: number) => (
                              <span
                                key={s}
                                className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                              >
                                ★ {s}
                              </span>
                            ))}
                        </div>
                      </div>
                      <span className="font-black text-xs sm:text-sm text-emerald-600 font-mono">
                        + {formatAmount(wDraw.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllHistory(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t('modalHistory.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modale de partage */}
      {showShareModal && isComplete && simulation && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          simulation={simulation}
          numbers={gameMode === 'swisslotto' ? swissTicket.numbers : emTicket.numbers}
          bonus={gameMode === 'swisslotto' ? swissTicket.bonus : null}
          stars={gameMode === 'euromillions' ? emTicket.stars : undefined}
          startYear={startDate.slice(0, 4)}
          game={gameMode}
          currency={currency}
        />
      )}

      {/* 6. Modale d'incitation au partage */}
      {showShareTrigger && isComplete && (
        <ShareTriggerModal
          isOpen={showShareTrigger}
          onClose={() => setShowShareTrigger(false)}
          numbers={gameMode === 'swisslotto' ? swissTicket.numbers : emTicket.numbers}
          bonus={gameMode === 'swisslotto' ? swissTicket.bonus : null}
          stars={gameMode === 'euromillions' ? emTicket.stars : undefined}
          game={gameMode}
        />
      )}
    </div>
  );
};

export default App;

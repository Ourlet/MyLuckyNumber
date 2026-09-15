import React, { useState, useCallback } from 'react';
import { UserTicket } from '../types/lottery';

export interface GridSelectorProps {
  /** Numéros principaux sélectionnés (1 à 42, max 6) */
  selectedNumbers?: number[];
  /** Numéro Chance sélectionné (1 à 6) */
  selectedBonus?: number | null;
  /** Callback déclenché à chaque modification de la sélection */
  onChange?: (ticket: UserTicket) => void;
  /** Callback déclenché lorsque la grille est complète (6 numéros + 1 chance) */
  onComplete?: (ticket: { numbers: number[]; bonus: number }) => void;
  /** Classe CSS additionnelle pour le conteneur */
  className?: string;
}

const TOTAL_MAIN_NUMBERS = 42;
const MAX_MAIN_SELECTION = 6;
const TOTAL_BONUS_NUMBERS = 6;

// Palette officielle suisse
const SWISS_RED = '#D52B1E';

export const GridSelector: React.FC<GridSelectorProps> = ({
  selectedNumbers: controlledNumbers,
  selectedBonus: controlledBonus,
  onChange,
  onComplete,
  className = '',
}) => {
  // Gestion d'état interne (compatible mode contrôlé ou non contrôlé)
  const [internalNumbers, setInternalNumbers] = useState<number[]>([]);
  const [internalBonus, setInternalBonus] = useState<number | null>(null);
  const [flashAnimation, setFlashAnimation] = useState(false);

  const numbers = controlledNumbers !== undefined ? controlledNumbers : internalNumbers;
  const bonus = controlledBonus !== undefined ? controlledBonus : internalBonus;

  const notifyChange = useCallback(
    (newNumbers: number[], newBonus: number | null) => {
      const sorted = [...newNumbers].sort((a, b) => a - b);
      if (controlledNumbers === undefined) setInternalNumbers(sorted);
      if (controlledBonus === undefined) setInternalBonus(newBonus);

      onChange?.({ numbers: sorted, bonus: newBonus });

      if (sorted.length === MAX_MAIN_SELECTION && newBonus !== null) {
        onComplete?.({ numbers: sorted, bonus: newBonus });
      }
    },
    [controlledNumbers, controlledBonus, onChange, onComplete]
  );

  // Bascule de sélection d'un numéro principal
  const toggleNumber = (num: number) => {
    if (numbers.includes(num)) {
      notifyChange(
        numbers.filter((n) => n !== num),
        bonus
      );
    } else {
      if (numbers.length < MAX_MAIN_SELECTION) {
        notifyChange([...numbers, num], bonus);
      }
    }
  };

  // Bascule de sélection du numéro Chance (1 seul)
  const toggleBonus = (num: number) => {
    const newBonus = bonus === num ? null : num;
    notifyChange(numbers, newBonus);
  };

  // Génération Flash aléatoire (6 numéros uniques + 1 chance)
  const handleFlash = () => {
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 500);

    const pool = Array.from({ length: TOTAL_MAIN_NUMBERS }, (_, i) => i + 1);
    const flashNumbers: number[] = [];

    while (flashNumbers.length < MAX_MAIN_SELECTION) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      flashNumbers.push(pool[randomIndex]);
      pool.splice(randomIndex, 1);
    }

    const flashBonus = Math.floor(Math.random() * TOTAL_BONUS_NUMBERS) + 1;
    notifyChange(flashNumbers, flashBonus);
  };

  // Réinitialisation complète
  const handleReset = () => {
    notifyChange([], null);
  };

  const isComplete = numbers.length === MAX_MAIN_SELECTION && bonus !== null;
  const hasSelection = numbers.length > 0 || bonus !== null;

  return (
    <div
      className={`w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden font-sans transition-all ${className}`}
    >
      {/* En-tête Swiss Design */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Drapeau Suisse Stylisé */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shadow-md relative overflow-hidden"
              style={{ backgroundColor: SWISS_RED }}
              title="Swiss Lotto"
            >
              <span className="text-sm select-none">✚</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                Grille Swiss Lotto
              </h2>
              <p className="text-xs text-slate-400">Sélectionnez vos 6 numéros + 1 numéro Chance</p>
            </div>
          </div>

          {/* Badge d'état global */}
          <div
            className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors duration-200 ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isComplete ? 'Grille complète ✓' : `${numbers.length}/6 • ${bonus ? '1/1' : '0/1'}`}
          </div>
        </div>

        {/* Barre de prévisualisation du ticket */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1">
              Ticket :
            </span>
            {Array.from({ length: MAX_MAIN_SELECTION }).map((_, idx) => {
              const val = numbers[idx];
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    val
                      ? 'text-white shadow-sm scale-100'
                      : 'bg-slate-800/70 text-slate-500 border border-dashed border-slate-700'
                  }`}
                  style={val ? { backgroundColor: SWISS_RED } : undefined}
                >
                  {val ?? '–'}
                </div>
              );
            })}

            <span className="text-slate-600 px-1 font-bold">+</span>

            {/* Pastille Chance Ticket */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black ring-2 transition-all ${
                bonus
                  ? 'bg-amber-400 text-slate-950 ring-amber-300 shadow-sm'
                  : 'bg-slate-800/70 text-slate-500 ring-slate-700 border border-dashed border-slate-600'
              }`}
              title="Numéro Chance"
            >
              {bonus ?? '–'}
            </div>
          </div>

          {/* Raccourcis d'actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFlash}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all ${
                flashAnimation ? 'ring-2 ring-amber-400 scale-105' : ''
              }`}
              title="Sélection automatique aléatoire"
            >
              <svg
                className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse"
                viewBox="0 0 24 24"
              >
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
              <span>Flash</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!hasSelection}
              className="text-xs font-medium px-2.5 py-1.5 rounded-full text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-white/5 active:scale-95 transition-all"
              title="Effacer la sélection"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Section 1 : 42 Numéros Principaux */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 flex items-center gap-2">
              <span>Numéros principaux</span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">
                (choisir 6 numéros)
              </span>
            </label>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                numbers.length === MAX_MAIN_SELECTION
                  ? 'bg-red-50 text-red-600'
                  : 'text-slate-500 bg-slate-100'
              }`}
            >
              {numbers.length} / {MAX_MAIN_SELECTION}
            </span>
          </div>

          {/* Grille tactile 7 colonnes (6 rangées de 7 = 42 numéros) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {Array.from({ length: TOTAL_MAIN_NUMBERS }, (_, i) => i + 1).map((num) => {
              const isSelected = numbers.includes(num);
              const isLocked = !isSelected && numbers.length >= MAX_MAIN_SELECTION;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleNumber(num)}
                  disabled={isLocked}
                  aria-pressed={isSelected}
                  aria-label={`Numéro ${num}`}
                  className={`
                    relative aspect-square rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base
                    flex items-center justify-center select-none touch-manipulation transition-all duration-150
                    ${
                      isSelected
                        ? 'text-white shadow-md shadow-red-600/30 scale-105 ring-2 ring-red-400 ring-offset-2'
                        : isLocked
                        ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-red-50 hover:border-red-200 hover:text-red-600 active:scale-90'
                    }
                  `}
                  style={isSelected ? { backgroundColor: SWISS_RED } : undefined}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Séparateur élégant */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 absolute">
            et
          </span>
        </div>

        {/* Section 2 : Numéro Chance (1 à 6) */}
        <div className="bg-gradient-to-br from-amber-50/50 via-slate-50 to-orange-50/40 p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-black shadow-sm">
                ★
              </span>
              <label className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-800">
                Numéro Chance
              </label>
              <span className="text-[11px] text-slate-500 font-normal">
                (1 seul numéro de 1 à 6)
              </span>
            </div>

            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                bonus !== null ? 'bg-amber-100 text-amber-900' : 'text-slate-500 bg-slate-200/70'
              }`}
            >
              {bonus !== null ? '1 / 1 sélectionné' : '0 / 1'}
            </span>
          </div>

          {/* Rangée Chance (6 pastilles spacieuses) */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: TOTAL_BONUS_NUMBERS }, (_, i) => i + 1).map((num) => {
              const isSelected = bonus === num;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleBonus(num)}
                  aria-pressed={isSelected}
                  aria-label={`Numéro Chance ${num}`}
                  className={`
                    relative aspect-square rounded-xl sm:rounded-2xl font-black text-sm sm:text-base
                    flex items-center justify-center select-none touch-manipulation transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40 ring-2 ring-amber-300 ring-offset-2 scale-105'
                        : 'bg-white text-slate-700 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 active:scale-90 shadow-sm'
                    }
                  `}
                >
                  <span className="relative z-10">{num}</span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 text-[10px] text-amber-700">★</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Boutons d'actions principaux pour mobile & desktop */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleFlash}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all border border-slate-200/80 shadow-sm"
          >
            <svg
              className="w-4 h-4 text-amber-500 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
            </svg>
            <span>Tirage Flash Aléatoire</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!hasSelection}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-transparent hover:bg-slate-100 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-transparent transition-all border border-slate-200"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GridSelector;

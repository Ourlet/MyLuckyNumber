import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { Language } from '../i18n/types';

/**
 * Drapeaux vectoriels SVG haute fidélité aux couleurs vives officielles.
 * Garantit un rendu éclatant sur tous les OS (évite les emojis monochromes [CH] [GB] de Windows).
 */
export const SwissFlag: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 rounded-md shadow-xs overflow-hidden ${className}`}
    aria-hidden="true"
  >
    {/* Fond rouge suisse vif (#D52B1E) */}
    <rect width="32" height="32" fill="#D52B1E" />
    {/* Croix blanche suisse proportionnelle */}
    <path
      d="M13 6.5h6v6.5h6.5v6H19v6.5h-6V19H6.5v-6H13z"
      fill="#FFFFFF"
    />
  </svg>
);

export const UKFlag: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 rounded-md shadow-xs overflow-hidden ${className}`}
    aria-hidden="true"
  >
    <clipPath id="uk-flag-clip-switcher">
      <rect width="32" height="32" rx="4" />
    </clipPath>
    <g clipPath="url(#uk-flag-clip-switcher)">
      {/* Fond bleu royal (#012169) */}
      <rect width="32" height="32" fill="#012169" />
      {/* Diagonales blanches */}
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#FFFFFF" strokeWidth="6" />
      {/* Diagonales rouges */}
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="3" />
      {/* Croix droite blanche */}
      <path d="M16 0 V32 M0 16 H32" stroke="#FFFFFF" strokeWidth="9" />
      {/* Croix droite rouge */}
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="5.2" />
    </g>
  </svg>
);
export const FranceFlag: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 rounded-md shadow-xs overflow-hidden ${className}`}
    aria-hidden="true"
  >
    {/* Bleu-blanc-rouge */}
    <rect width="10.67" height="32" x="0" fill="#002395" />
    <rect width="10.67" height="32" x="10.67" fill="#FFFFFF" />
    <rect width="10.67" height="32" x="21.33" fill="#ED2939" />
  </svg>
);

interface LanguageItem {
  code: Language;
  label: string;
  sublabel: string;
  shortLabel: string;
  badgeBg: string;
  flag: React.ReactNode;
}

const LANGUAGES: LanguageItem[] = [
  {
    code: 'fr',
    label: 'Français',
    sublabel: 'Suisse romande',
    shortLabel: 'FR',
    badgeBg: 'bg-red-50 text-red-700 border-red-200/80',
    flag: <SwissFlag className="w-5 h-5" />,
  },
  {
    code: 'fr-FR',
    label: 'Français',
    sublabel: 'France',
    shortLabel: 'FR',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    flag: <FranceFlag className="w-5 h-5" />,
  },
  {
    code: 'de',
    label: 'Deutsch',
    sublabel: 'Deutschschweiz',
    shortLabel: 'DE',
    badgeBg: 'bg-red-50 text-red-700 border-red-200/80',
    flag: <SwissFlag className="w-5 h-5" />,
  },
  {
    code: 'en',
    label: 'English',
    sublabel: 'International',
    shortLabel: 'EN',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    flag: <UKFlag className="w-5 h-5" />,
  },
];

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Fermeture automatique au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Bouton Select avec Drapeau SVG vif & Chevron */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Choisir la langue / Sprache wählen / Choose language"
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50/90 border transition-all shadow-2xs hover:shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Drapeau SVG en couleur */}
        <div className="transition-transform group-hover:scale-105">
          {current.flag}
        </div>

        {/* Libellé de langue */}
        <span className="text-xs font-extrabold text-slate-800 tracking-tight">
          {current.label}
        </span>

        {/* Badge de code langue avec couleur contextuelle */}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${current.badgeBg}`}
        >
          {current.shortLabel}
        </span>

        {/* Flèche déroulante rotative */}
        <ChevronDown
          className={`size-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Menu déroulant Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Langues disponibles"
          className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Langue / Sprache / Language
          </div>

          <div className="space-y-0.5">
            {LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 text-emerald-950 font-bold border border-emerald-200/60 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="transition-transform group-hover:scale-105">
                      {item.flag}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">
                          {item.label}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded border ${item.badgeBg}`}
                        >
                          {item.shortLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.sublabel}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Language } from './types';
import { getCurrencyForLanguage, getEmCostForLanguage, getEmCurrencyForLanguage } from './types';
import { trackEvent } from '../utils/analytics';
import fr from './locales/fr.json';
import de from './locales/de.json';
import en from './locales/en.json';

// fr-FR uses the same French translations as fr (identical language, different currency)
const translations: Record<Language, Record<string, any>> = {
  fr,
  'fr-FR': fr,
  de,
  en,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (dateStr: string) => string;
  getRankLabel: (rankKey: string) => string;
  /** 'CHF' pour fr / de, 'EUR' pour fr-FR / en */
  currency: 'CHF' | 'EUR';
  /** Prix d'une grille EuroMillions selon la locale (3.50 CHF ou 2.50 EUR) */
  emCostPerDraw: number;
  /** Devise EuroMillions selon la locale */
  emCurrency: 'CHF' | 'EUR';
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'app_lang';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'fr-FR' || saved === 'de' || saved === 'en') {
      return saved as Language;
    }
  } catch {
    // localStorage might be unavailable
  }

  const navLang = navigator.language?.toLowerCase() || '';
  if (navLang.startsWith('de')) return 'de';
  if (navLang.startsWith('en')) return 'en';
  // fr-FR: langue fr mais pays France
  if (navLang === 'fr-fr') return 'fr-FR';
  return 'fr';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Synchronise <html lang="..."> attribute on mount & change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    if (newLang === language) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
    trackEvent('Change Language', { language: newLang });
  }, [language]);

  // Currency derived from language (CHF for Swiss, EUR for France/international)
  const currency = useMemo(() => getCurrencyForLanguage(language), [language]);
  // EuroMillions: 3.50 CHF in Switzerland, 2.50 EUR in France/international
  const emCostPerDraw = useMemo(() => getEmCostForLanguage(language), [language]);
  const emCurrency = useMemo(() => getEmCurrencyForLanguage(language), [language]);

  // Translation lookup helper with nested paths (e.g. 'header.title') and {{var}} replacement
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: any = translations[language];

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          // Fallback to French if translation is missing
          let fallback: any = translations.fr;
          for (const fk of keys) {
            if (fallback && typeof fallback === 'object' && fk in fallback) {
              fallback = fallback[fk];
            } else {
              fallback = undefined;
              break;
            }
          }
          current = fallback ?? path;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      if (!params) return current;

      return current.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return key in params ? String(params[key]) : `{{${key}}}`;
      });
    },
    [language]
  );

  // Format date in current Swiss / European locale
  const formatDate = useCallback(
    (dateStr: string): string => {
      if (!dateStr) return '';
      try {
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return dateStr;
        const date = new Date(year, month - 1, day);

        const localeMap: Record<Language, string> = {
          fr: 'fr-CH',
          'fr-FR': 'fr-FR',
          de: 'de-CH',
          en: 'en-GB',
        };

        return date.toLocaleDateString(localeMap[language] || 'fr-CH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch {
        return dateStr;
      }
    },
    [language]
  );

  const getRankLabel = useCallback(
    (rankKey: string): string => {
      const rankTranslation = t(`ranks.${rankKey}`);
      return rankTranslation.startsWith('ranks.') ? rankKey : rankTranslation;
    },
    [t]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
      getRankLabel,
      currency,
      emCostPerDraw,
      emCurrency,
    }),
    [language, setLanguage, t, formatDate, getRankLabel, currency, emCostPerDraw, emCurrency]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

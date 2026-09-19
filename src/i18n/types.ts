export type Language = 'fr' | 'fr-FR' | 'de' | 'en';

export interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fr',    label: 'Français (CH)', shortLabel: 'FR', flag: '🇨🇭' },
  { code: 'fr-FR', label: 'Français (FR)', shortLabel: 'FR', flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch',        shortLabel: 'DE', flag: '🇨🇭' },
  { code: 'en',    label: 'English',        shortLabel: 'EN', flag: '🇬🇧' },
];

/** Returns 'CHF' for Swiss locales (fr, de), 'EUR' for fr-FR and en */
export function getCurrencyForLanguage(lang: Language): 'CHF' | 'EUR' {
  return lang === 'fr-FR' || lang === 'en' ? 'EUR' : 'CHF';
}

/** EuroMillions currency: CHF in Switzerland, EUR in France/international */
export function getEmCurrencyForLanguage(lang: Language): 'CHF' | 'EUR' {
  return getCurrencyForLanguage(lang);
}

/** EuroMillions cost per grid: 3.50 CHF (Switzerland), 2.50 EUR (France/intl) */
export function getEmCostForLanguage(lang: Language): number {
  return getCurrencyForLanguage(lang) === 'CHF' ? 3.5 : 2.5;
}

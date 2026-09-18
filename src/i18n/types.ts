export type Language = 'fr' | 'de' | 'en';

export interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇨🇭' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE', flag: '🇨🇭' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
];

import { useEffect } from 'react';
import { UserTicket } from '../types/lottery';
import { EuromillionsUserTicket } from '../types/euromillions';
import { LotoUserTicket } from '../types/loto';

export type LotteryGame = 'swisslotto' | 'euromillions' | 'loto';

/**
 * Retourne le chemin d'URL canonique pour chaque loterie (SEO Google)
 */
export function getCanonicalPathForGame(game: LotteryGame): string {
  switch (game) {
    case 'loto':
      return '/loto-francais';
    case 'euromillions':
      return '/euromillions';
    case 'swisslotto':
    default:
      return '/swiss-lotto';
  }
}

/**
 * Détecte le jeu depuis l'URL :
 * 1. Chemin d'accès (/loto-francais, /euromillions, /swiss-lotto, /loto, etc.)
 * 2. Paramètre de requête (?game=loto, ?game=euromillions, etc.)
 */
export function getUrlGameMode(): LotteryGame {
  if (typeof window === 'undefined') return 'swisslotto';

  // 1. Détection prioritaire via le chemin d'URL
  const path = window.location.pathname.toLowerCase();
  if (
    path.includes('loto-francais') ||
    path.includes('loto-fdj') ||
    path.includes('/loto') ||
    path.includes('superloto') ||
    path.includes('grandloto')
  ) {
    return 'loto';
  }
  if (path.includes('euromillions')) return 'euromillions';
  if (path.includes('swiss-lotto') || path.includes('swisslotto')) return 'swisslotto';

  // 2. Détection de repli via les paramètres de requête ?game=...
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game')?.toLowerCase();
  if (
    game === 'loto' ||
    game === 'loto-francais' ||
    game === 'loto-fdj' ||
    game === 'superloto' ||
    game === 'grandloto' ||
    game === 'fdj'
  ) {
    return 'loto';
  }
  if (game === 'euromillions' || params.has('stars') || params.has('s')) {
    return 'euromillions';
  }
  if (game === 'swisslotto' || game === 'swiss-lotto' || game === 'swiss') {
    return 'swisslotto';
  }

  return 'swisslotto';
}

/**
 * Décode un ticket Swiss Lotto (6 numéros 1..42 + 1 chance 1..6)
 * Supporte : ?numbers=1,5,6,16,30,34&chance=4 (et fallback legacy ?n=...&b=...)
 */
export function getUrlSwissTicket(): UserTicket | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const nParam = params.get('numbers') || params.get('n');
    const bParam = params.get('chance') || params.get('bonus') || params.get('b');
    if (!nParam || !bParam) return null;

    const numbers = nParam.split(',').map((s) => parseInt(s.trim(), 10));
    if (numbers.length !== 6 || numbers.some((n) => isNaN(n) || n < 1 || n > 42)) {
      return null;
    }
    if (new Set(numbers).size !== 6) return null;

    const bonus = parseInt(bParam.trim(), 10);
    if (isNaN(bonus) || bonus < 1 || bonus > 6) return null;

    return {
      numbers: numbers.sort((a, b) => a - b),
      bonus,
    };
  } catch {
    return null;
  }
}

/**
 * Décode un ticket EuroMillions (5 numéros 1..50 + 2 étoiles 1..12)
 * Supporte : ?numbers=3,14,22,35,40&stars=4,9 (et fallback legacy ?n=...&s=...)
 */
export function getUrlEuromillionsTicket(): EuromillionsUserTicket | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const nParam = params.get('numbers') || params.get('n');
    const sParam = params.get('stars') || params.get('s');
    if (!nParam || !sParam) return null;

    const numbers = nParam.split(',').map((s) => parseInt(s.trim(), 10));
    if (numbers.length !== 5 || numbers.some((n) => isNaN(n) || n < 1 || n > 50)) {
      return null;
    }
    if (new Set(numbers).size !== 5) return null;

    const stars = sParam.split(',').map((s) => parseInt(s.trim(), 10));
    if (stars.length !== 2 || stars.some((s) => isNaN(s) || s < 1 || s > 12)) {
      return null;
    }
    if (new Set(stars).size !== 2) return null;

    return {
      numbers: numbers.sort((a, b) => a - b),
      stars: stars.sort((a, b) => a - b),
    };
  } catch {
    return null;
  }
}

/**
 * Décode un ticket Loto FDJ (5 numéros 1..49 + 1 chance 1..10)
 * Supporte : ?numbers=7,14,22,35,41&chance=8 (et fallback legacy ?n=...&b=...)
 */
export function getUrlLotoTicket(): LotoUserTicket | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const nParam = params.get('numbers') || params.get('n');
    const bParam = params.get('chance') || params.get('bonus') || params.get('b') || params.get('c');
    if (!nParam || !bParam) return null;

    const numbers = nParam.split(',').map((s) => parseInt(s.trim(), 10));
    if (numbers.length !== 5 || numbers.some((n) => isNaN(n) || n < 1 || n > 49)) {
      return null;
    }
    if (new Set(numbers).size !== 5) return null;

    const chance = parseInt(bParam.trim(), 10);
    if (isNaN(chance) || chance < 1 || chance > 10) return null;

    return {
      numbers: numbers.sort((a, b) => a - b),
      chance,
    };
  } catch {
    return null;
  }
}

/**
 * Génère une URL de partage complète et propre pour le jeu et la combinaison donnés :
 * - /loto-francais?numbers=7,14,22,35,41&chance=8
 * - /euromillions?numbers=3,14,22,35,40&stars=4,9
 * - /swiss-lotto?numbers=1,5,6,16,30,34&chance=4
 */
export function createLotteryShareUrl({
  game,
  numbers,
  bonus,
  stars,
}: {
  game: LotteryGame;
  numbers: number[];
  bonus?: number | null;
  stars?: number[];
}): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const canonicalPath = getCanonicalPathForGame(game);
  const url = new URL(canonicalPath, origin);

  if (numbers && numbers.length > 0) {
    url.searchParams.set('numbers', numbers.join(','));
  }

  if (game === 'loto' && bonus !== undefined && bonus !== null) {
    url.searchParams.set('chance', String(bonus));
  } else if (game === 'euromillions' && stars && stars.length > 0) {
    url.searchParams.set('stars', stars.join(','));
  } else if (game === 'swisslotto' && bonus !== undefined && bonus !== null) {
    url.searchParams.set('chance', String(bonus));
  }

  return url.toString();
}

/**
 * Synchronise dynamiquement l'URL selon le jeu sélectionné avec les points d'entrée SEO :
 * - /loto-francais?numbers=...&chance=...
 * - /euromillions?numbers=...&stars=...
 * - /swiss-lotto?numbers=...&chance=...
 */
export function useMultiLotteryUrlSync({
  game,
  swissTicket,
  emTicket,
  lotoTicket,
}: {
  game: LotteryGame;
  swissTicket: UserTicket;
  emTicket: EuromillionsUserTicket;
  lotoTicket: LotoUserTicket;
}) {
  useEffect(() => {
    const url = new URL(window.location.href);

    // Détermine le chemin canonique de destination
    const currentPath = url.pathname.toLowerCase();
    const isAcceptedLotoPath =
      currentPath === '/loto-francais' || currentPath === '/loto' || currentPath === '/loto-fdj';
    const isAcceptedEmPath = currentPath === '/euromillions';
    const isAcceptedSwissPath =
      currentPath === '/swiss-lotto' || currentPath === '/swisslotto' || currentPath === '/';

    if (game === 'loto' && !isAcceptedLotoPath) {
      url.pathname = '/loto-francais';
    } else if (game === 'euromillions' && !isAcceptedEmPath) {
      url.pathname = '/euromillions';
    } else if (game === 'swisslotto' && !isAcceptedSwissPath) {
      url.pathname = '/swiss-lotto';
    }

    // Nettoyage des anciens paramètres
    url.searchParams.delete('n');
    url.searchParams.delete('s');
    url.searchParams.delete('b');
    url.searchParams.delete('c');
    url.searchParams.delete('game'); // Le chemin (/loto-francais, /euromillions, /swiss-lotto) porte déjà l'info de manière SEO

    if (game === 'loto') {
      url.searchParams.delete('stars');
      if (lotoTicket.numbers.length === 5 && lotoTicket.chance !== null) {
        url.searchParams.set('numbers', lotoTicket.numbers.join(','));
        url.searchParams.set('chance', String(lotoTicket.chance));
      } else {
        url.searchParams.delete('numbers');
        url.searchParams.delete('chance');
      }
    } else if (game === 'euromillions') {
      url.searchParams.delete('chance');
      if (emTicket.numbers.length === 5 && emTicket.stars.length === 2) {
        url.searchParams.set('numbers', emTicket.numbers.join(','));
        url.searchParams.set('stars', emTicket.stars.join(','));
      } else {
        url.searchParams.delete('numbers');
        url.searchParams.delete('stars');
      }
    } else {
      url.searchParams.delete('stars');
      if (swissTicket.numbers.length === 6 && swissTicket.bonus !== null) {
        url.searchParams.set('numbers', swissTicket.numbers.join(','));
        url.searchParams.set('chance', String(swissTicket.bonus));
      } else {
        url.searchParams.delete('numbers');
        url.searchParams.delete('chance');
      }
    }

    const newTarget = url.pathname + url.search + url.hash;
    const currentTarget = window.location.pathname + window.location.search + window.location.hash;
    if (newTarget !== currentTarget) {
      window.history.replaceState(null, '', newTarget);
    }
  }, [
    game,
    swissTicket.numbers,
    swissTicket.bonus,
    emTicket.numbers,
    emTicket.stars,
    lotoTicket.numbers,
    lotoTicket.chance,
  ]);

  return null;
}

import { useEffect } from 'react';
import { UserTicket } from '../types/lottery';
import { EuromillionsUserTicket } from '../types/euromillions';
import { LotoUserTicket } from '../types/loto';

export type LotteryGame = 'swisslotto' | 'euromillions' | 'loto';

/**
 * Détecte le jeu depuis l'URL (chemin d'accès /euromillions, /loto, /swisslotto OU query param ?game=...)
 */
export function getUrlGameMode(): LotteryGame {
  if (typeof window === 'undefined') return 'swisslotto';

  // 1. Détection via le chemin d'URL (support des sous-pages SPA)
  const path = window.location.pathname.toLowerCase();
  if (path.includes('euromillions')) return 'euromillions';
  if (path.includes('loto') || path.includes('superloto') || path.includes('grandloto')) return 'loto';
  if (path.includes('swisslotto') || path.includes('swiss-lotto')) return 'swisslotto';

  // 2. Détection via le paramètre de requête ?game=... ou présence de paramètres caractéristiques
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game')?.toLowerCase();
  if (game === 'loto' || game === 'superloto' || game === 'grandloto' || game === 'fdj') {
    return 'loto';
  }
  if (game === 'euromillions' || params.has('stars') || params.has('s')) {
    return 'euromillions';
  }
  if (game === 'swisslotto' || game === 'swiss') {
    return 'swisslotto';
  }

  return 'swisslotto';
}

/**
 * Décode un ticket Swiss Lotto (6 numéros 1..42 + 1 chance 1..6)
 * Supporte : ?game=swisslotto&numbers=1,5,6,16,30,34&chance=4 (et fallback legacy ?n=...&b=...)
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
 * Supporte : ?game=euromillions&numbers=3,14,22,35,40&stars=4,9 (et fallback legacy ?n=...&s=...)
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
 * Supporte : ?game=loto&numbers=7,14,22,35,41&chance=8 (et fallback legacy ?n=...&b=...)
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
 * Synchronise dynamiquement l'URL selon le jeu sélectionné avec des paramètres clairs et lisibles :
 * - EuroMillions : ?game=euromillions&numbers=3,14,22,35,40&stars=4,9
 * - Loto FDJ     : ?game=loto&numbers=7,14,22,35,41&chance=8
 * - Swiss Lotto  : ?game=swisslotto&numbers=1,5,6,16,30,34&chance=4
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

    // Nettoyage des anciens paramètres courts s'ils existent
    url.searchParams.delete('n');
    url.searchParams.delete('s');
    url.searchParams.delete('b');
    url.searchParams.delete('c');

    if (game === 'loto') {
      url.searchParams.set('game', 'loto');
      url.searchParams.delete('stars');
      if (lotoTicket.numbers.length === 5 && lotoTicket.chance !== null) {
        url.searchParams.set('numbers', lotoTicket.numbers.join(','));
        url.searchParams.set('chance', String(lotoTicket.chance));
      } else {
        url.searchParams.delete('numbers');
        url.searchParams.delete('chance');
      }
    } else if (game === 'euromillions') {
      url.searchParams.set('game', 'euromillions');
      url.searchParams.delete('chance');
      if (emTicket.numbers.length === 5 && emTicket.stars.length === 2) {
        url.searchParams.set('numbers', emTicket.numbers.join(','));
        url.searchParams.set('stars', emTicket.stars.join(','));
      } else {
        url.searchParams.delete('numbers');
        url.searchParams.delete('stars');
      }
    } else {
      url.searchParams.set('game', 'swisslotto');
      url.searchParams.delete('stars');
      if (swissTicket.numbers.length === 6 && swissTicket.bonus !== null) {
        url.searchParams.set('numbers', swissTicket.numbers.join(','));
        url.searchParams.set('chance', String(swissTicket.bonus));
      } else {
        url.searchParams.delete('numbers');
        url.searchParams.delete('chance');
      }
    }

    if (url.toString() !== window.location.href) {
      window.history.replaceState(null, '', url.toString());
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

import { useEffect } from 'react';
import { UserTicket } from '../types/lottery';
import { EuromillionsUserTicket } from '../types/euromillions';

export type LotteryGame = 'swisslotto' | 'euromillions';

/**
 * Détecte le jeu depuis l'URL (?game=euromillions ou présence du paramètre s)
 */
export function getUrlGameMode(): LotteryGame {
  if (typeof window === 'undefined') return 'swisslotto';
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game')?.toLowerCase();
  if (game === 'euromillions' || params.has('s')) {
    return 'euromillions';
  }
  return 'swisslotto';
}

/**
 * Décode un ticket Swiss Lotto (6 numéros 1..42 + 1 chance 1..6)
 */
export function getUrlSwissTicket(): UserTicket | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const nParam = params.get('n');
    const bParam = params.get('b');
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
 */
export function getUrlEuromillionsTicket(): EuromillionsUserTicket | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const nParam = params.get('n');
    const sParam = params.get('s');
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
 * Synchronise l'URL selon le jeu sélectionné
 */
export function useMultiLotteryUrlSync({
  game,
  swissTicket,
  emTicket,
}: {
  game: LotteryGame;
  swissTicket: UserTicket;
  emTicket: EuromillionsUserTicket;
}) {
  useEffect(() => {
    const url = new URL(window.location.href);

    if (game === 'euromillions') {
      url.searchParams.set('game', 'euromillions');
      url.searchParams.delete('b');
      if (emTicket.numbers.length === 5 && emTicket.stars.length === 2) {
        url.searchParams.set('n', emTicket.numbers.join(','));
        url.searchParams.set('s', emTicket.stars.join(','));
      } else {
        url.searchParams.delete('n');
        url.searchParams.delete('s');
      }
    } else {
      url.searchParams.delete('game');
      url.searchParams.delete('s');
      if (swissTicket.numbers.length === 6 && swissTicket.bonus !== null) {
        url.searchParams.set('n', swissTicket.numbers.join(','));
        url.searchParams.set('b', String(swissTicket.bonus));
      } else {
        url.searchParams.delete('n');
        url.searchParams.delete('b');
      }
    }

    if (url.toString() !== window.location.href) {
      window.history.replaceState(null, '', url.toString());
    }
  }, [game, swissTicket.numbers, swissTicket.bonus, emTicket.numbers, emTicket.stars]);

  return null;
}

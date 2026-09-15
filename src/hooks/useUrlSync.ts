import { useEffect } from 'react';
import { UserTicket } from '../types/lottery';

/**
 * Parses and validates URL search parameters `n` (main numbers) and `b` (bonus/chance).
 * Returns a valid UserTicket or null if data is invalid.
 */
function parseUrlTicket(): UserTicket | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const nParam = params.get('n');
    const bParam = params.get('b');

    if (!nParam || !bParam) return null;

    // Parse main numbers
    const numbers = nParam.split(',').map((s) => {
      const n = parseInt(s.trim(), 10);
      if (isNaN(n)) throw new Error('Invalid number');
      return n;
    });

    // Validate: exactly 6 unique integers between 1 and 42
    if (numbers.length !== 6) return null;
    if (!numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 42)) return null;
    if (new Set(numbers).size !== 6) return null;

    // Parse bonus
    const bonus = parseInt(bParam.trim(), 10);
    if (isNaN(bonus) || !Number.isInteger(bonus) || bonus < 1 || bonus > 6) return null;

    return {
      numbers: numbers.sort((a, b) => a - b),
      bonus,
    };
  } catch {
    return null;
  }
}

/**
 * Reads URL parameters on mount and returns a hydrated ticket if valid.
 * Also updates the URL bar dynamically whenever the ticket state changes.
 */
export function useUrlSync(ticket: UserTicket) {
  const { numbers, bonus } = ticket;
  const isComplete = numbers.length === 6 && bonus !== null;

  // Update URL when ticket changes
  useEffect(() => {
    const url = new URL(window.location.href);

    if (isComplete) {
      url.searchParams.set('n', numbers.join(','));
      url.searchParams.set('b', String(bonus));
    } else {
      url.searchParams.delete('n');
      url.searchParams.delete('b');
    }

    // Only replace if URL actually changed
    if (url.toString() !== window.location.href) {
      window.history.replaceState(null, '', url.toString());
    }
  }, [numbers, bonus, isComplete]);

  return null;
}

/**
 * Returns the hydrated ticket from URL params on initial load.
 * Call this once at component mount to get initial state.
 */
export function getUrlTicket(): UserTicket | null {
  return parseUrlTicket();
}

import { useState, useEffect } from 'react';
import { CompactEuromillionsDraw } from '../types/euromillions';

let cachedDraws: CompactEuromillionsDraw[] | null = null;
let fetchPromise: Promise<CompactEuromillionsDraw[]> | null = null;

export function useEuromillionsHistory() {
  const [draws, setDraws] = useState<CompactEuromillionsDraw[]>(() => cachedDraws || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedDraws);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedDraws) {
      setDraws(cachedDraws);
      setIsLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/data/euromillions-history.json')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Impossible de charger l'historique EuroMillions (${res.status})`);
          }
          return res.json() as Promise<CompactEuromillionsDraw[]>;
        })
        .then((data) => {
          // Tirages récents en premier (décroissant) pour l'interface
          cachedDraws = [...data].reverse();
          return cachedDraws;
        });
    }

    let isMounted = true;
    fetchPromise
      .then((data) => {
        if (isMounted) {
          setDraws(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { draws, isLoading, error };
}

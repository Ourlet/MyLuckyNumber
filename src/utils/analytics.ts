declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

type QueuedEvent = {
  eventName: string;
  eventData?: Record<string, any>;
};

const eventQueue: QueuedEvent[] = [];
let isFlushing = false;

function flushQueue() {
  if (typeof window === 'undefined' || !window.umami || typeof window.umami.track !== 'function' || isFlushing) {
    return;
  }
  isFlushing = true;
  while (eventQueue.length > 0) {
    const item = eventQueue.shift();
    if (item) {
      try {
        if (import.meta.env.DEV) {
          console.log(`[Umami Analytics (Flushed)] ${item.eventName}`, item.eventData ?? {});
        }
        window.umami.track(item.eventName, item.eventData);
      } catch (err) {
        console.error(`[Umami Analytics] Error sending queued event "${item.eventName}":`, err);
      }
    }
  }
  isFlushing = false;
}

// Initialise un timer de scrutation pour vider la file d'attente dès que le script Umami distant est chargé
if (typeof window !== 'undefined') {
  const pollInterval = setInterval(() => {
    if (window.umami && typeof window.umami.track === 'function') {
      flushQueue();
      clearInterval(pollInterval);
    }
  }, 100);

  // Arrêt après 10 secondes si Umami est bloqué (ex: adblocker)
  setTimeout(() => clearInterval(pollInterval), 10000);
}

export const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  if (window.umami && typeof window.umami.track === 'function') {
    try {
      if (import.meta.env.DEV) {
        console.log(`[Umami Analytics] ${eventName}`, eventData ?? {});
      }
      window.umami.track(eventName, eventData);
    } catch (err) {
      console.error(`[Umami Analytics] Error sending event "${eventName}":`, err);
    }
  } else {
    if (import.meta.env.DEV) {
      console.log(`[Umami Analytics (Queued)] ${eventName}`, eventData ?? {});
    }
    eventQueue.push({ eventName, eventData });
  }
};

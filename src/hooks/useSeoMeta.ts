import { useEffect } from 'react';
import { LotteryGame } from './useUrlSync';

interface SeoMetaConfig {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonicalPath: string;
}

const SEO_CONFIG: Record<LotteryGame, SeoMetaConfig> = {
  loto: {
    title: 'Loto FDJ : Vos numéros sont-ils déjà sortis ? | Simulateur gains depuis 2008',
    description:
      'Vérifier si mes numéros sont déjà sortis au Loto FDJ : simulateur officiel de gains rétroactif depuis 2008 (Loto classique, Super Loto, Grand Loto). Analysez vos chances et votre rentabilité !',
    ogTitle: 'Loto FDJ : Vos numéros sont-ils déjà sortis ? | My Magic Numbers',
    ogDescription:
      'Simulateur gains Loto depuis 2008 : testez vos 5 numéros et votre numéro Chance face à plus de 2 800 tirages officiels de la FDJ.',
    canonicalPath: '/loto-francais',
  },
  euromillions: {
    title: 'EuroMillions : Vos numéros sont-ils déjà sortis ? | Simulateur de gains depuis 2004',
    description:
      'Vérifiez vos 5 numéros et 2 étoiles face à tous les tirages officiels de l’EuroMillions depuis 2004. Calculez vos gains réels et votre rentabilité face à l’histoire officielle !',
    ogTitle: 'Simulateur Gains EuroMillions depuis 2004 | My Magic Numbers',
    ogDescription:
      'Découvrez ce que vos 5 numéros et 2 étoiles auraient réellement rapporté face à l’historique complet de l’EuroMillions.',
    canonicalPath: '/euromillions',
  },
  swisslotto: {
    title: 'Swiss Lotto : Vos numéros sont-ils déjà sortis ? | Simulateur historique',
    description:
      'Découvrez ce que vos numéros fétiches auraient réellement rapporté face à l’historique officiel du Swiss Lotto (42 numéros + 6 numéros chance).',
    ogTitle: 'Simulateur historique Swiss Lotto | My Magic Numbers',
    ogDescription:
      'Découvrez ce que vos numéros fétiches auraient réellement rapporté face à l’historique officiel du Swiss Lotto.',
    canonicalPath: '/swiss-lotto',
  },
};

/**
 * Met à jour dynamiquement les balises document.title, meta description, OpenGraph et canonical
 * lors de la navigation entre les différents jeux (Loto FDJ, EuroMillions, Swiss Lotto).
 */
export function useSeoMeta(game: LotteryGame) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const config = SEO_CONFIG[game] || SEO_CONFIG.swisslotto;

    // 1. Titre de page
    document.title = config.title;

    // 2. Meta description
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.replace(/[\[\]"]/g, '').split('=');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMetaTag('meta[name="description"]', 'content', config.description);
    setMetaTag('meta[property="og:title"]', 'content', config.ogTitle);
    setMetaTag('meta[property="og:description"]', 'content', config.ogDescription);
    setMetaTag('meta[property="og:url"]', 'content', `https://mymagicnumbers.com${config.canonicalPath}`);
    setMetaTag('meta[name="twitter:title"]', 'content', config.ogTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', config.ogDescription);

    // 3. Lien Canonique
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://mymagicnumbers.com${config.canonicalPath}`);
  }, [game]);
}

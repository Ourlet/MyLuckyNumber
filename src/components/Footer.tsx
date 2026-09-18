import React from 'react';
import { Coffee, ShieldCheck, Mail, Clover } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { trackEvent } from '../utils/analytics';

export const Footer: React.FC = () => {
  const { t } = useI18n();

  const handleSupportClick = () => {
    trackEvent('Click Support Project');
  };

  const handleContactClick = () => {
    trackEvent('Click Contact');
  };

  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-8 text-slate-500">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Bloc de gauche : Mentions légales, non-affiliation et vie privée */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 text-xs tracking-tight">
                <Clover className="size-4 text-emerald-600" aria-hidden="true" />
                My Magic Numbers
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400">
                © {new Date().getFullYear()}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('footer.disclaimer')}
            </p>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="size-3.5 text-emerald-600/80 shrink-0" aria-hidden="true" />
              <span>{t('footer.privacy')}</span>
            </p>
          </div>

          {/* Bloc de droite : Made with, Contact et Bouton Soutien / Café */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 md:gap-5 text-xs">
            <p className="text-[11px] text-slate-400 font-medium">
              {t('footer.madeWith')}
            </p>

            <div className="flex items-center gap-2.5">
              {/* Lien Contact */}
              <a
                href="mailto:lavignedigilab@gmail.com"
                onClick={handleContactClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Mail className="size-3.5 text-slate-500" aria-hidden="true" />
                <span>{t('footer.contact')}</span>
              </a>

              {/* Bouton Soutenir / Buy me a coffee */}
              <a
                href="https://buymeacoffee.com/lavignedigilab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSupportClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 shadow-2xs transition-all active:scale-95"
                title={t('footer.support')}
              >
                <Coffee className="size-3.5 text-amber-600" aria-hidden="true" />
                <span>{t('footer.support')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

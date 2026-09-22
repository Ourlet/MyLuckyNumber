import React, { useState, useMemo } from 'react';
import {
  Database,
  Cpu,
  ShieldCheck,
  Calendar,
  Lightbulb,
  LineChart,
  HelpCircle,
  ChevronDown,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export const SeoContent: React.FC = () => {
  const { t, language } = useI18n();

  // État pour l'accordéon FAQ (le 1er élément est ouvert par défaut)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const faqItems = useMemo(
    () => [
      {
        q: t('seo.faq.q1'),
        a: t('seo.faq.a1'),
      },
      {
        q: t('seo.faq.q2'),
        a: t('seo.faq.a2'),
      },
      {
        q: t('seo.faq.q3'),
        a: t('seo.faq.a3'),
      },
      {
        q: t('seo.faq.q4'),
        a: t('seo.faq.a4'),
      },
    ],
    [t]
  );

  // Schema.org FAQPage JSON-LD dynamique selon la locale
  const faqSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: language === 'fr-FR' ? 'fr' : language,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
  }, [faqItems, language]);

  return (
    <section
      aria-label="Guide méthodologique, probabilités et FAQ"
      className="mt-12 mb-4 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8"
    >
      {/* Script JSON-LD dynamique pour Google & moteurs de recherche */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Conteneur principal en harmonie avec le thème blanc & émeraude du site */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-10 lg:p-12 space-y-12 sm:space-y-16">

        {/* ========================================================================= */}
        {/* SECTION 1 : Comment fonctionne le simulateur rétrospectif ?               */}
        {/* ========================================================================= */}
        <article className="space-y-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Database className="size-3.5" aria-hidden="true" />
              {t('seo.section1.badge')}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('seo.section1.title')}
            </h2>
          </div>

          <div className="space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl">
            <p>{t('seo.section1.p1')}</p>
            <p>{t('seo.section1.p2')}</p>
          </div>

          {/* 3 Cartes de fonctionnalités / réassurance */}
          <div className="grid gap-4 sm:grid-cols-3 pt-1">
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-5 space-y-2.5 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database className="size-4.5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('seo.section1.card1Title')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('seo.section1.card1Desc')}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-5 space-y-2.5 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Cpu className="size-4.5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('seo.section1.card2Title')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('seo.section1.card2Desc')}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-5 space-y-2.5 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <div className="size-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShieldCheck className="size-4.5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('seo.section1.card3Title')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('seo.section1.card3Desc')}
              </p>
            </div>
          </div>
        </article>

        <div className="border-t border-slate-200/80" />

        {/* ========================================================================= */}
        {/* SECTION 2 : Le piège des dates d'anniversaire et la dilution des gains    */}
        {/* ========================================================================= */}
        <article className="space-y-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200/60">
              <Calendar className="size-3.5" aria-hidden="true" />
              {t('seo.section2.badge')}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('seo.section2.title')}
            </h2>
          </div>

          <div className="space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl">
            <p>{t('seo.section2.p1')}</p>
            <p>{t('seo.section2.p2')}</p>
            <p>{t('seo.section2.p3')}</p>
          </div>

          {/* Encadré d'optimisation / Astuce statistique */}
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/90 p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 shadow-2xs">
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Lightbulb className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-950">
                {t('seo.section2.tipTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
                {t('seo.section2.tipText')}
              </p>
            </div>
          </div>
        </article>

        <div className="border-t border-slate-200/80" />

        {/* ========================================================================= */}
        {/* SECTION 3 : Loto vs Investissement : Comprendre le coût d'opportunité     */}
        {/* ========================================================================= */}
        <article className="space-y-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
              <LineChart className="size-3.5" aria-hidden="true" />
              {t('seo.section3.badge')}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('seo.section3.title')}
            </h2>
          </div>

          <div className="space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl">
            <p>{t('seo.section3.p1')}</p>
            <p>{t('seo.section3.p2')}</p>
            <p>{t('seo.section3.p3')}</p>
          </div>

          {/* Comparaison Visuelle Double Volet */}
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            {/* Loterie */}
            <div className="rounded-2xl bg-rose-50/60 border border-rose-200/70 p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Loterie d'État
                </span>
                <TrendingDown className="size-4 text-rose-600" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-800 font-mono">
                TRJ ~50%
              </p>
              <p className="text-xs text-rose-700 leading-relaxed">
                Espérance mathématique négative structurelle : environ 50 % de chaque mise financent les taxes publiques et les coûts de l'exploitant.
              </p>
            </div>

            {/* ETF Monde */}
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/70 p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {t('seo.section3.statLabel')}
                </span>
                <TrendingUp className="size-4 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                +7% / an
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Rendement composé historique moyen d'un portefeuille mondial diversifié (actions internationales avec dividendes réinvestis).
              </p>
            </div>
          </div>
        </article>

        <div className="border-t border-slate-200/80" />

        {/* ========================================================================= */}
        {/* SECTION 4 : Foire Aux Questions (FAQ Accordéon)                           */}
        {/* ========================================================================= */}
        <article className="space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-purple-50 text-purple-700 border border-purple-200/60">
              <HelpCircle className="size-3.5" aria-hidden="true" />
              {t('seo.faq.badge')}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('seo.faq.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              {t('seo.faq.subtitle')}
            </p>
          </div>

          {/* Accordéon FAQ */}
          <div className="space-y-2.5 pt-1">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              const headingId = `faq-heading-${index}`;
              const panelId = `faq-panel-${index}`;

              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                    isOpen
                      ? 'bg-emerald-50/30 border-emerald-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    id={headingId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-2xl"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-3">
                      <span className="flex items-center justify-center size-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold shrink-0">
                        Q{index + 1}
                      </span>
                      <span>{item.q}</span>
                    </span>
                    <ChevronDown
                      className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headingId}
                      className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150"
                    >
                      <div className="pl-9">{item.a}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
};

export default SeoContent;

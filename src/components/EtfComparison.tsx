import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

/** Formatage monétaire propre */
function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const rounded = Math.round(abs);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${isNegative ? '-' : ''}${formatted} ${currency === 'EUR' ? '€' : 'CHF'}`;
}

/** Calcul DCA composé : chaque mise de 2.50 € est capitalisée à 7%/an depuis sa date */
function calculateEtfDCA(
  draws: Array<{ d?: string; date?: string }>,
  costPerDraw: number = 2.5,
  annualReturn: number = 0.07
) {
  const now = Date.now();
  let etfValue = 0;

  for (const draw of draws) {
    const rawDate = draw.d || draw.date;
    if (!rawDate) continue;
    const drawTime = new Date(rawDate).getTime();
    const yearsElapsed = (now - drawTime) / (365.25 * 24 * 3600 * 1000);
    etfValue += costPerDraw * Math.pow(1 + annualReturn, yearsElapsed);
  }

  const totalInvested = draws.length * costPerDraw;
  const netGain = etfValue - totalInvested;

  return { etfValue, totalInvested, netGain };
}

interface EtfComparisonProps {
  simulation: {
    totalCost: number;
    totalWinnings: number;
    netProfit: number;
  };
  filteredDraws: Array<{ d?: string; date?: string }>;
  currency?: string;
  costPerDraw?: number;
  gameLabel?: string;
}

export const EtfComparison: React.FC<EtfComparisonProps> = ({
  simulation,
  filteredDraws,
  currency = 'EUR',
  costPerDraw = 2.5,
  gameLabel = 'EuroMillions',
}) => {
  const { t } = useI18n();
  const etf = useMemo(
    () => calculateEtfDCA(filteredDraws, costPerDraw),
    [filteredDraws, costPerDraw]
  );

  const lottoNet = simulation.netProfit;
  const difference = etf.netGain - lottoNet;

  return (
    <div className="etf-card" id="etf-comparison">
      {/* Barre de gradient supérieure */}
      <div className="etf-card-topbar" aria-hidden="true" />

      {/* Titre */}
      <div className="etf-header">
        <div className="etf-icon-wrapper">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <h3 className="etf-title">{t('etf.title')}</h3>
          <p className="etf-subtitle">{t('etf.subtitle')}</p>
        </div>
      </div>

      {/* Deux colonnes comparatives */}
      <div className="etf-columns">
        {/* Colonne EuroMillions */}
        <div className="etf-col etf-col-lotto">
          <div className="etf-col-header">
            <span className="etf-col-badge etf-col-badge-lotto">🎰</span>
            <span className="etf-col-label">{gameLabel}</span>
          </div>

          <div className="etf-col-body">
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.totalCost')}</span>
              <span className="etf-row-value text-slate-700">
                -{formatCurrency(simulation.totalCost, currency)}
              </span>
            </div>
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.totalWinnings')}</span>
              <span className="etf-row-value text-emerald-600">
                +{formatCurrency(simulation.totalWinnings, currency)}
              </span>
            </div>
            <div className="etf-divider" />
            <div className="etf-row etf-row-result">
              <span className="etf-row-label font-bold">{t('etf.netProfit')}</span>
              <span
                className={`etf-row-value-big ${
                  lottoNet >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <TrendingDown className="size-4 inline-block mr-1" />
                {formatCurrency(lottoNet, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Flèche séparatrice (desktop) */}
        <div className="etf-arrow-separator">
          <ArrowRight className="size-5 text-slate-300" />
        </div>

        {/* Colonne ETF */}
        <div className="etf-col etf-col-etf">
          <div className="etf-col-header">
            <span className="etf-col-badge etf-col-badge-etf">📈</span>
            <span className="etf-col-label">{t('etf.etfBadge')}</span>
          </div>

          <div className="etf-col-body">
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.invested')}</span>
              <span className="etf-row-value text-slate-700">
                {formatCurrency(etf.totalInvested, currency)}
              </span>
            </div>
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.estimatedValue')}</span>
              <span className="etf-row-value text-emerald-600">
                ~{formatCurrency(etf.etfValue, currency)}
              </span>
            </div>
            <div className="etf-divider" />
            <div className="etf-row etf-row-result">
              <span className="etf-row-label font-bold">{t('etf.etfNetGain')}</span>
              <span className="etf-row-value-big text-emerald-600">
                <TrendingUp className="size-4 inline-block mr-1" />
                +{formatCurrency(etf.netGain, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Écart dramatique */}
      {difference > 0 && (
        <div className="etf-diff-banner">
          <span className="etf-diff-label">{t('etf.missedDiff')}</span>
          <span className="etf-diff-value">+{formatCurrency(difference, currency)}</span>
        </div>
      )}

      {/* Disclaimer */}
      <p className="etf-disclaimer">
        Simulation basée sur un DCA de {costPerDraw.toFixed(2).replace('.', ',')} {currency === 'EUR' ? '€' : 'CHF'} par tirage à 7% annualisé composé. Les performances passées ne préjugent pas des performances futures.
      </p>
    </div>
  );
};

export default EtfComparison;

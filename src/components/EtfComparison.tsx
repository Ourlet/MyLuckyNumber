import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { DrawResult } from '../types/lottery';
import { SimulationSummary } from '../types/lottery';
import { COST_PER_DRAW } from '../utils/calculator';
import { useI18n } from '../i18n/I18nContext';

/** Format suisse avec apostrophe : 7'420 CHF */
function formatSwissCHF(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const rounded = Math.round(abs);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${isNegative ? '-' : ''}${formatted} CHF`;
}

/** Calcul DCA composé : chaque mise de 2.50 CHF est capitalisée à 7%/an depuis sa date */
function calculateEtfDCA(draws: DrawResult[], annualReturn: number = 0.07) {
  const now = Date.now();
  let etfValue = 0;

  for (const draw of draws) {
    const drawTime = new Date(draw.date).getTime();
    const yearsElapsed = (now - drawTime) / (365.25 * 24 * 3600 * 1000);
    etfValue += COST_PER_DRAW * Math.pow(1 + annualReturn, yearsElapsed);
  }

  const totalInvested = draws.length * COST_PER_DRAW;
  const netGain = etfValue - totalInvested;

  return { etfValue, totalInvested, netGain };
}

interface EtfComparisonProps {
  simulation: SimulationSummary;
  filteredDraws: DrawResult[];
}

export const EtfComparison: React.FC<EtfComparisonProps> = ({
  simulation,
  filteredDraws,
}) => {
  const { t } = useI18n();
  const etf = useMemo(
    () => calculateEtfDCA(filteredDraws),
    [filteredDraws]
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
        {/* Colonne Lotto */}
        <div className="etf-col etf-col-lotto">
          <div className="etf-col-header">
            <span className="etf-col-badge etf-col-badge-lotto">🎰</span>
            <span className="etf-col-label">{t('etf.lottoBadge')}</span>
          </div>

          <div className="etf-col-body">
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.totalCost')}</span>
              <span className="etf-row-value text-slate-700">
                -{formatSwissCHF(simulation.totalCost)}
              </span>
            </div>
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.totalWinnings')}</span>
              <span className="etf-row-value text-emerald-600">
                +{formatSwissCHF(simulation.totalWinnings)}
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
                {formatSwissCHF(lottoNet)}
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
                {formatSwissCHF(etf.totalInvested)}
              </span>
            </div>
            <div className="etf-row">
              <span className="etf-row-label">{t('etf.estimatedValue')}</span>
              <span className="etf-row-value text-emerald-600">
                ~{formatSwissCHF(etf.etfValue)}
              </span>
            </div>
            <div className="etf-divider" />
            <div className="etf-row etf-row-result">
              <span className="etf-row-label font-bold">{t('etf.etfNetGain')}</span>
              <span className="etf-row-value-big text-emerald-600">
                <TrendingUp className="size-4 inline-block mr-1" />
                +{formatSwissCHF(etf.netGain)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Écart dramatique */}
      {difference > 0 && (
        <div className="etf-diff-banner">
          <span className="etf-diff-label">{t('etf.missedDiff')}</span>
          <span className="etf-diff-value">+{formatSwissCHF(difference)}</span>
        </div>
      )}

      {/* Disclaimer */}
      <p className="etf-disclaimer">{t('etf.disclaimer')}</p>
    </div>
  );
};

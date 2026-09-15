import React, { useState, useCallback, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { SimulationSummary } from '../types/lottery';

/**
 * Format a number as Swiss CHF with apostrophe separator (for share messages).
 * Ex: 1500 -> "1'500 CHF", -3200 -> "-3'200 CHF"
 */
function formatShareCHF(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${isNeg ? '-' : ''}${formatted} CHF`;
}

interface ShareCardProps {
  simulation: SimulationSummary;
  numbers: number[];
  bonus: number;
  startYear: string;
}

export const ShareCard: React.FC<ShareCardProps> = ({
  simulation,
  numbers,
  bonus,
  startYear,
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Build the shareable URL
  const shareUrl = (() => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('n', numbers.join(','));
    url.searchParams.set('b', String(bonus));
    return url.toString();
  })();

  // Build the share message
  const message = (() => {
    const net = simulation.netProfit;
    const maxGain = simulation.bestDraw
      ? formatShareCHF(simulation.bestDraw.amount)
      : '0 CHF';

    if (net < 0) {
      const perte = formatShareCHF(Math.abs(net));
      return `J'ai testé mes numéros au Swiss Lotto depuis ${startYear} : j'aurais perdu ${perte} et mon plus gros gain est de ${maxGain} 😂. Teste ta grille ici : ${shareUrl}`;
    } else {
      const gain = formatShareCHF(net);
      return `Mes numéros fétiches auraient rapporté +${gain} au Swiss Lotto depuis ${startYear} ! Mon record : ${maxGain} 🤑. Teste ta grille ici : ${shareUrl}`;
    }
  })();

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setShowToast(true);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setShowToast(true);
    }
  }, [message]);

  // Reset copied state after 2.5s
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // WhatsApp share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  // Native share
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: 'My Lucky Number – Swiss Lotto',
        text: message,
        url: shareUrl,
      });
    } catch {
      // User cancelled or not supported — silently ignore
    }
  }, [message, shareUrl]);

  const isLoss = simulation.netProfit < 0;

  return (
    <div className="share-card">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isLoss
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          <Share2 className="size-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Partager votre résultat
          </h3>
          <p className="text-[11px] text-slate-500">
            Défiez vos amis avec leur propre grille
          </p>
        </div>
      </div>

      {/* Message preview */}
      <div className="share-message-preview">
        <p className="text-[12.5px] leading-relaxed text-slate-700">
          {isLoss ? (
            <>
              J'ai testé mes numéros au Swiss Lotto depuis {startYear} : j'aurais perdu{' '}
              <strong className="text-rose-600">
                {formatShareCHF(Math.abs(simulation.netProfit))}
              </strong>{' '}
              et mon plus gros gain est de{' '}
              <strong className="text-emerald-600">
                {simulation.bestDraw
                  ? formatShareCHF(simulation.bestDraw.amount)
                  : '0 CHF'}
              </strong>{' '}
              😂
            </>
          ) : (
            <>
              Mes numéros fétiches auraient rapporté{' '}
              <strong className="text-emerald-600">
                +{formatShareCHF(simulation.netProfit)}
              </strong>{' '}
              au Swiss Lotto depuis {startYear} ! Mon record :{' '}
              <strong className="text-emerald-600">
                {simulation.bestDraw
                  ? formatShareCHF(simulation.bestDraw.amount)
                  : '0 CHF'}
              </strong>{' '}
              🤑
            </>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 mt-4">
        {/* WhatsApp — primary action */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn-whatsapp"
        >
          <MessageCircle className="size-4.5" />
          <span>Envoyer sur WhatsApp</span>
          <ExternalLink className="size-3.5 ml-auto opacity-60" />
        </a>

        {/* Secondary row */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`share-btn-secondary ${
              copied
                ? 'share-btn-copied'
                : ''
            }`}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span>{copied ? 'Copié !' : 'Copier le lien'}</span>
          </button>

          {/* Native share (mobile) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="share-btn-secondary"
            >
              <Share2 className="size-4" />
              <span>Partager…</span>
            </button>
          )}

          {/* If native share not available, the copy button takes full width */}
          {!canNativeShare && (
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn-secondary"
            >
              <ExternalLink className="size-4" />
              <span>Ouvrir le lien</span>
            </a>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="share-toast">
          <Check className="size-3.5" />
          <span>Copié dans le presse-papier !</span>
        </div>
      )}
    </div>
  );
};

export default ShareCard;

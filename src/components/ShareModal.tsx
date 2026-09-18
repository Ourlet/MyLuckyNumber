import React, { useState, useCallback, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Download,
  Loader2,
  Sparkles,
  Smartphone,
  Square,
  X,
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { SimulationSummary } from '../types/lottery';
import { generateStoryImage } from '../utils/storyImage';

function formatShareCHF(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${isNeg ? '-' : ''}${formatted} CHF`;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationSummary;
  numbers: number[];
  bonus: number;
  startYear: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  simulation,
  numbers,
  bonus,
  startYear,
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyDownloaded, setStoryDownloaded] = useState(false);
  const [storyFormat, setStoryFormat] = useState<'story' | 'square'>('story');

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Build the shareable URL
  const shareUrl = (() => {
    if (typeof window === 'undefined') return '';
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
    trackEvent('Lien Copié');
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setToastMessage('Lien copié dans le presse-papier !');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setToastMessage('Lien copié dans le presse-papier !');
    }
  }, [message]);

  // Download Story image
  const handleDownloadStory = useCallback(async () => {
    setIsGenerating(true);
    trackEvent('Téléchargement Story', { format: storyFormat });
    try {
      const dataUrl = await generateStoryImage(simulation, numbers, bonus, {
        format: storyFormat,
        startYear,
      });

      const filename = `swiss-lotto-${storyFormat}-${numbers.join('-')}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStoryDownloaded(true);
      setToastMessage(`Image ${storyFormat === 'story' ? 'Story (9:16)' : 'Carré (1:1)'} téléchargée !`);
      setTimeout(() => setStoryDownloaded(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la génération de l’image:', err);
      setToastMessage('Erreur lors de la création de l’image');
    } finally {
      setIsGenerating(false);
    }
  }, [simulation, numbers, bonus, storyFormat, startYear]);

  // Reset toast state after 2.8s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setCopied(false);
        setToastMessage(null);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!isOpen) return null;

  // WhatsApp share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  // Native share
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'My Magic Numbers – Swiss Lotto',
        text: message,
        url: shareUrl,
      });
    } catch {
      // User cancelled or not supported
    }
  };

  const isLoss = simulation.netProfit < 0;

  // Backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="share-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="share-modal-card">
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="share-modal-close"
          aria-label="Fermer"
        >
          <X className="size-4.5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 text-left">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isLoss
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Share2 className="size-5" />
          </div>
          <div>
            <h2 id="share-modal-title" className="text-base font-extrabold text-slate-900 leading-tight">
              Partager votre résultat
            </h2>
            <p className="text-xs text-slate-500">
              Défiez vos amis avec leur propre grille fétiche
            </p>
          </div>
        </div>

        {/* Message preview */}
        <div className="share-message-preview text-left mb-4">
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
        <div className="flex flex-col gap-2.5">
          {/* Story Format Selector */}
          <div className="share-format-picker">
            <button
              type="button"
              className={`share-format-btn ${storyFormat === 'story' ? 'active' : ''}`}
              onClick={() => setStoryFormat('story')}
            >
              <Smartphone className="size-3.5" />
              <span>Story (9:16)</span>
            </button>
            <button
              type="button"
              className={`share-format-btn ${storyFormat === 'square' ? 'active' : ''}`}
              onClick={() => setStoryFormat('square')}
            >
              <Square className="size-3" />
              <span>Carré (1:1)</span>
            </button>
          </div>

          {/* Download Story / Image Button */}
          <button
            type="button"
            onClick={handleDownloadStory}
            disabled={isGenerating}
            className="share-btn-story"
            title="Télécharger une image haute définition pour WhatsApp Status ou Instagram Story"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4.5 animate-spin" />
                <span>Génération de l'image...</span>
              </>
            ) : storyDownloaded ? (
              <>
                <Check className="size-4.5 text-emerald-400" />
                <span>Image téléchargée !</span>
              </>
            ) : (
              <>
                <Download className="size-4.5 text-amber-300" />
                <span>Télécharger mon image {storyFormat === 'story' ? 'Story (9:16)' : 'Carrée'}</span>
                <Sparkles className="size-3.5 ml-auto text-amber-300 opacity-90" />
              </>
            )}
          </button>

          {/* WhatsApp — primary action */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn-whatsapp"
            onClick={() => {
              trackEvent('Partage WhatsApp');
              onClose();
            }}
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
                copied ? 'share-btn-copied' : ''
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
        {toastMessage && (
          <div className="share-toast">
            <Check className="size-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;

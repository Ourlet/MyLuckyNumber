import React, { useEffect, useCallback } from 'react';
import { MessageCircle, ExternalLink, Dices, X } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { useI18n } from '../i18n/I18nContext';

interface ShareTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  numbers: number[];
  bonus: number;
}

export const ShareTriggerModal: React.FC<ShareTriggerModalProps> = ({
  isOpen,
  onClose,
  numbers,
  bonus,
}) => {
  const { t } = useI18n();

  // Fermer avec Échap
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

  if (!isOpen) return null;

  // Build shareable URL
  const shareUrl = (() => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('n', numbers.join(','));
    url.searchParams.set('b', String(bonus));
    return url.toString();
  })();

  const message = t('shareTrigger.shareMessage', { url: shareUrl });
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  // Clic sur le backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="stm-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-trigger-title"
    >
      <div className="stm-card">
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="stm-close"
          aria-label="Fermer"
        >
          <X className="size-4.5" />
        </button>

        {/* Emoji décoratif */}
        <div className="stm-emoji" aria-hidden="true">🎰</div>

        {/* Titre */}
        <h2 id="share-trigger-title" className="stm-title">
          {t('shareTrigger.title')}
        </h2>

        {/* Message */}
        <p className="stm-message">
          {t('shareTrigger.message')}
        </p>

        {/* Actions */}
        <div className="stm-actions">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn-whatsapp"
            onClick={() => {
              trackEvent('Partage WhatsApp Modal');
              onClose();
            }}
          >
            <MessageCircle className="size-4.5" />
            <span>{t('shareTrigger.whatsappBtn')}</span>
            <ExternalLink className="size-3.5 ml-auto opacity-60" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="stm-secondary"
          >
            <Dices className="size-4" />
            <span>{t('shareTrigger.testMoreBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useId } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2, X, Sparkles, Mail } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { trackEvent } from '../utils/analytics';

interface FeedbackWidgetProps {
  gameMode?: 'swisslotto' | 'euromillions';
}

const TARGET_EMAIL = 'lavignedigilab@gmail.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${TARGET_EMAIL}`;

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ gameMode = 'euromillions' }) => {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);
  const [validationError, setValidationError] = useState('');

  const commentId = useId();
  const emailId = useId();

  // Écoute de la touche Échap pour fermer la modale
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      trackEvent('feedback_modal_opened', { gameMode, language });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown, gameMode, language]);

  const handleOpen = () => {
    setIsOpen(true);
    setStatus('idle');
    setValidationError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Si on a terminé avec succès, on réinitialise pour la prochaine fois
    if (status === 'success') {
      setTimeout(() => {
        setRating(0);
        setComment('');
        setEmail('');
        setStatus('idle');
        setNeedsActivation(false);
      }, 300);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && status !== 'loading') {
      handleClose();
    }
  };

  const getRatingLabel = (score: number) => {
    if (!score) return '';
    const key = String(score) as '1' | '2' | '3' | '4' | '5';
    return t(`feedback.ratings.${key}`) || `${score} / 5`;
  };

  const getRatingBadgeStyle = (score: number) => {
    switch (score) {
      case 1:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 2:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 3:
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 4:
        return gameMode === 'euromillions'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 5:
        return gameMode === 'euromillions'
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-300 shadow-xs'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-emerald-300 shadow-xs';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setValidationError(t('feedback.requireRating'));
      return;
    }
    setValidationError('');
    setStatus('loading');
    setErrorMessage('');

    const ratingLabel = getRatingLabel(rating);

    const payload = {
      _subject: `[My Magic Numbers] Feedback ${rating}/5 étoiles (${ratingLabel})`,
      _template: 'table',
      _captcha: 'false',
      Rating: `${rating} / 5 - ${ratingLabel}`,
      Comment: comment.trim() || '(Aucun commentaire saisi)',
      User_Email: email.trim() || '(Non renseigné)',
      Game_Mode: gameMode === 'swisslotto' ? 'Swiss Lotto' : 'EuroMillions',
      Language: language,
      Page_URL: typeof window !== 'undefined' ? window.location.href : '',
      Submitted_At: new Date().toLocaleString('fr-CH', { timeZone: 'Europe/Zurich' }),
      User_Agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    try {
      const response = await fetch(FORMSUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      // FormSubmit renvoie soit success: "true", soit un message d'activation s'il s'agit de la première soumission
      const msg = typeof data?.message === 'string' ? data.message.toLowerCase() : '';
      const isActivation = msg.includes('activation') || msg.includes('activate');

      if (response.ok && (data?.success === 'true' || isActivation)) {
        setStatus('success');
        setNeedsActivation(isActivation);
        trackEvent('feedback_submitted', {
          rating,
          hasComment: Boolean(comment.trim()),
          hasEmail: Boolean(email.trim()),
          gameMode,
        });
      } else {
        throw new Error(data?.message || 'Erreur lors de l\'envoi');
      }
    } catch (err: any) {
      console.error('[Feedback] Submission error:', err);
      setStatus('error');
      setErrorMessage(err?.message || t('feedback.errorMessage'));
      trackEvent('feedback_submission_failed', { rating, error: String(err) });
    }
  };

  const activeScore = hoveredRating || rating;

  // Lien direct mailto en cas de besoin
  const mailtoUrl = (() => {
    const subject = encodeURIComponent(`[My Magic Numbers] Feedback ${rating || 5}/5 étoiles`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVoici mon retour sur My Magic Numbers :\n\n` +
      `Note : ${rating}/5 (${getRatingLabel(rating) || 'Non spécifié'})\n` +
      `Commentaire : ${comment || '(aucun)'}\n` +
      (email ? `Email de réponse : ${email}\n` : '') +
      `Mode de jeu : ${gameMode}\n` +
      `Langue : ${language}\n`
    );
    return `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`;
  })();

  return (
    <>
      {/* 1. Bouton fixe vertical collé sur le côté de l'écran */}
      <button
        id="feedback-side-button"
        type="button"
        onClick={handleOpen}
        aria-label={t('feedback.buttonAria')}
        title={t('feedback.buttonAria')}
        className="fb-side-btn group cursor-pointer"
      >
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-300 text-amber-950 text-[11px] font-black shadow-xs group-hover:scale-110 transition-transform">
          ★
        </span>
        <span
          className="text-[11px] font-bold tracking-widest uppercase font-sans text-white select-none py-1"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {t('feedback.button')}
        </span>
        <MessageSquare className="w-3.5 h-3.5 text-white/90 group-hover:scale-110 transition-transform" />
      </button>

      {/* 2. Fenêtre modale */}
      {isOpen && (
        <div
          className="fb-backdrop"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
        >
          <div className="fb-card">
            {/* Barre d'accentuation supérieure */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400" />

            {/* Bouton de fermeture */}
            <button
              type="button"
              onClick={handleClose}
              disabled={status === 'loading'}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              aria-label={t('feedback.close')}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Corps de la modale */}
            <div className="p-6 sm:p-7">
              {/* ÉTAT SUCCÈS */}
              {status === 'success' ? (
                <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {t('feedback.successTitle')}
                    </h3>
                    <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                      {t('feedback.successMessage')}
                    </p>
                  </div>

                  {needsActivation && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
                      {t('feedback.activationNotice')}
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      {t('feedback.close')}
                    </button>
                  </div>
                </div>
              ) : (
                /* FORMULAIRE PRINCIPAL */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* En-tête */}
                  <div className="space-y-1.5 pr-8">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-bold tracking-wide uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('feedback.badge')}</span>
                    </div>
                    <h2 id="feedback-dialog-title" className="text-xl font-bold text-slate-900">
                      {t('feedback.title')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {t('feedback.subtitle')}
                    </p>
                  </div>

                  {/* Section 1 : Évaluation par étoiles */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {t('feedback.ratingLabel')} <span className="text-emerald-600">*</span>
                      </label>
                      {activeScore > 0 && (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ${getRatingBadgeStyle(
                            activeScore
                          )}`}
                        >
                          {getRatingLabel(activeScore)}
                        </span>
                      )}
                    </div>

                    {/* Ligne des étoiles */}
                    <div
                      className="flex items-center justify-center gap-2 sm:gap-3 py-3 px-4 rounded-2xl bg-slate-50/80 border border-slate-200/80"
                      role="radiogroup"
                      aria-label={t('feedback.ratingLabel')}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoveredRating || rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={rating === star}
                            aria-label={`${star} / 5 - ${getRatingLabel(star)}`}
                            onClick={() => {
                              setRating(star);
                              setValidationError('');
                            }}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer active:scale-95"
                          >
                            <Star
                              className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors duration-150 ${
                                isFilled
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                                  : 'text-slate-300 hover:text-slate-400 fill-transparent'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {validationError && (
                      <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {validationError}
                      </p>
                    )}
                  </div>

                  {/* Section 2 : Commentaire */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={commentId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        {t('feedback.commentLabel')}
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {comment.length} / 1000
                      </span>
                    </div>
                    <textarea
                      id={commentId}
                      rows={3}
                      maxLength={1000}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('feedback.commentPlaceholder')}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 resize-none"
                    />
                  </div>

                  {/* Section 3 : Email (optionnel) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={emailId}
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      {t('feedback.emailLabel')}
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('feedback.emailPlaceholder')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
                    />
                    <p className="text-[11px] text-slate-400">
                      {t('feedback.emailHint')}
                    </p>
                  </div>

                  {/* Message d'erreur avec alternative mailto */}
                  {status === 'error' && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{t('feedback.errorTitle')}</span>
                      </div>
                      <p>{errorMessage}</p>
                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={mailtoUrl}
                          className="inline-flex items-center gap-1 font-semibold text-rose-900 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {t('feedback.sendViaEmail')}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Bouton d'action */}
                  <div className="pt-1 space-y-2">
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('feedback.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('feedback.submit')}</span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-slate-400">
                      Envoyé directement à <span className="font-semibold text-slate-600">{TARGET_EMAIL}</span>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

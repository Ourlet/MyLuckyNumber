import { SimulationSummary } from '../types/lottery';
import { formatCHF } from './calculator';
import { Language } from '../i18n/types';

export interface StoryImageOptions {
  format?: 'story' | 'square'; // 'story' = 1080x1920 (9:16), 'square' = 1080x1080 (1:1)
  startYear?: string;
  language?: Language;
}

/**
 * Robust rounded rectangle implementation that eliminates the browser arcTo tangent bug
 * that previously caused stray lines on corners.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, Math.min(w / 2, h / 2)));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2);
    ctx.lineTo(x + radius, y + h);
    ctx.arc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, (3 * Math.PI) / 2);
    ctx.closePath();
  }
}

/**
 * Draw the official 4-leaf clover logo of My Magic Numbers
 */
function drawCloverLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string = '#ffffff'
) {
  ctx.save();
  ctx.fillStyle = color;
  const petalR = size * 0.28;
  const offset = size * 0.22;

  // 4 circular petals
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const px = cx + Math.cos(angle) * offset;
    const py = cy + Math.sin(angle) * offset;
    ctx.beginPath();
    ctx.arc(px, py, petalR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  // Center overlap circle
  ctx.beginPath();
  ctx.arc(cx, cy, petalR * 0.85, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  // Subtle curved stem
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  ctx.moveTo(cx, cy + offset * 0.5);
  ctx.quadraticCurveTo(
    cx + size * 0.12,
    cy + size * 0.48,
    cx + size * 0.22,
    cy + size * 0.65
  );
  ctx.stroke();
  ctx.closePath();

  ctx.restore();
}

function formatCanvasDate(dateStr: string, lang: Language): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    const localeMap: Record<Language, string> = { fr: 'fr-CH', 'fr-FR': 'fr-FR', de: 'de-CH', en: 'en-GB' };
    return date.toLocaleDateString(localeMap[lang] || 'fr-CH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const canvasI18n = {
  fr: {
    subtitle: 'Votre combinaison face à l’histoire',
    drawsAnalyzed: (count: number, startYear: string) =>
      `${count.toLocaleString('fr-CH')} tirages analysés (${startYear} — 2026)`,
    costPerGrid: '2.50 CHF / grille',
    ticketAnalyzed: 'TICKET ANALYSÉ',
    chanceBadge: (b: number) => `Chance ${b}`,
    chanceBall: 'CHANCE',
    bestWin: 'MEILLEUR GAIN',
    onDate: (d: string) => `le ${d}`,
    winningDraws: 'TIRAGES GAGNANTS',
    outOfDraws: (count: number) => `sur ${count} tirages`,
    totalWinnings: 'GAINS CUMULÉS',
    winsSummary: (wins: number, total: number) => `${wins} gains sur ${total} tirages`,
    netProfit: 'BILAN NET',
    etfTitle: 'Et si vous aviez investi au lieu de jouer ?',
    etfSubtitle: 'Même capital, deux destins radicalement différents',
    lottoBets: (amt: string) => `Mises : ${amt}`,
    lottoNet: (amt: string) => `Résultat net : ${amt}`,
    etfEstimated: (amt: string) => `Capital estimé : ~${amt}`,
    etfNetGain: (amt: string) => `Gain net : +${amt}`,
    missedDiff: 'Différence manquée :',
    punchlineLoss: '« Le million c’est sûrement pour le prochain tirage ! 🤞 »',
    punchlineWin: '« Ne change surtout rien, tes numéros sont en or pur ! ✨ »',
    challengeFriends: 'Défie tes proches avec leur propre grille fétiche',
    footerStory: 'Simulateur rétroactif indépendant Swiss Lotto 🇨🇭',
    footerSquare: 'Simulateur indépendant Swiss Lotto • Teste tes numéros en 3 secondes',
  },
  de: {
    subtitle: 'Ihre Zahlen im Spiegel der Geschichte',
    drawsAnalyzed: (count: number, startYear: string) =>
      `${count.toLocaleString('de-CH')} Ziehungen analysiert (${startYear} — 2026)`,
    costPerGrid: 'CHF 2.50 / Tipp',
    ticketAnalyzed: 'ANALYSIERTER TIPP',
    chanceBadge: (b: number) => `Glückszahl ${b}`,
    chanceBall: 'GLÜCK',
    bestWin: 'HÖCHSTER GEWINN',
    onDate: (d: string) => `am ${d}`,
    winningDraws: 'GEWINNENDE ZIEHUNGEN',
    outOfDraws: (count: number) => `von ${count} Ziehungen`,
    totalWinnings: 'GESAMTGEWINNE',
    winsSummary: (wins: number, total: number) => `${wins} Gewinne von ${total} Ziehungen`,
    netProfit: 'NETTOBILANZ',
    etfTitle: 'Was wäre, wenn Sie investiert hätten?',
    etfSubtitle: 'Gleicher Einsatz, zwei völlig unterschiedliche Wege',
    lottoBets: (amt: string) => `Einsatz: ${amt}`,
    lottoNet: (amt: string) => `Nettoergebnis: ${amt}`,
    etfEstimated: (amt: string) => `Geschätzter Wert: ~${amt}`,
    etfNetGain: (amt: string) => `Nettogewinn: +${amt}`,
    missedDiff: 'Entgangene Differenz:',
    punchlineLoss: '« Die Million kommt sicher bei der nächsten Ziehung! 🤞 »',
    punchlineWin: '« Nichts ändern, deine Zahlen sind aus purem Gold! ✨ »',
    challengeFriends: 'Fordere deine Freunde mit ihren Glückszahlen heraus',
    footerStory: 'Unabhängiger historischer Swiss Lotto-Simulator 🇨🇭',
    footerSquare: 'Unabhängiger Swiss Lotto-Simulator • Teste deine Zahlen in 3 Sekunden',
  },
  en: {
    subtitle: 'Your numbers against history',
    drawsAnalyzed: (count: number, startYear: string) =>
      `${count.toLocaleString('en-CH')} draws analysed (${startYear} — 2026)`,
    costPerGrid: 'CHF 2.50 / ticket',
    ticketAnalyzed: 'ANALYSED TICKET',
    chanceBadge: (b: number) => `Lucky ${b}`,
    chanceBall: 'LUCKY',
    bestWin: 'BEST WIN',
    onDate: (d: string) => `on ${d}`,
    winningDraws: 'WINNING DRAWS',
    outOfDraws: (count: number) => `out of ${count} draws`,
    totalWinnings: 'TOTAL WINNINGS',
    winsSummary: (wins: number, total: number) => `${wins} wins out of ${total} draws`,
    netProfit: 'NET BALANCE',
    etfTitle: 'What if you had invested instead?',
    etfSubtitle: 'Same capital, two radically different outcomes',
    lottoBets: (amt: string) => `Spent: ${amt}`,
    lottoNet: (amt: string) => `Net result: ${amt}`,
    etfEstimated: (amt: string) => `Estimated value: ~${amt}`,
    etfNetGain: (amt: string) => `Net gain: +${amt}`,
    missedDiff: 'Opportunity difference:',
    punchlineLoss: '« The million is definitely coming next draw! 🤞 »',
    punchlineWin: '« Change nothing, your numbers are pure gold! ✨ »',
    challengeFriends: 'Challenge your friends with their own lucky numbers',
    footerStory: 'Independent historic Swiss Lotto simulator 🇨🇭',
    footerSquare: 'Independent Swiss Lotto simulator • Test your numbers in 3 seconds',
  },
  // fr-FR uses same French text (EuroMillions data is always in EUR)
  'fr-FR': undefined as any,
};
// Clone fr content for fr-FR
canvasI18n['fr-FR'] = canvasI18n.fr;

/**
 * Generates an ultra-crisp Story / Square image in the exact luminous design theme of "My Magic Numbers".
 */
export async function generateStoryImage(
  summary: SimulationSummary,
  numbers: number[],
  bonus: number,
  options: StoryImageOptions = {}
): Promise<string> {
  const format = options.format || 'story';
  const startYear = options.startYear || '2013';
  const lang: Language = options.language || 'fr';
  const i18n = canvasI18n[lang] || canvasI18n.fr;

  const width = 1080;
  const height = format === 'story' ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to create canvas 2d context');
  }

  const isStory = format === 'story';
  const isLoss = summary.netProfit < 0;

  // -------------------------------------------------------------
  // 1. BACKGROUND & AMBIENT GLOWS (App theme: #f7faf7 / #f0fdf4)
  // -------------------------------------------------------------
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#f2f8f3');
  bgGrad.addColorStop(0.3, '#f7faf7');
  bgGrad.addColorStop(0.7, '#f7faf7');
  bgGrad.addColorStop(1, '#ecfdf5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft emerald ambient orbs (top-left and bottom-right)
  ctx.save();
  const topOrb = ctx.createRadialGradient(160, 140, 10, 160, 140, 500);
  topOrb.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
  topOrb.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = topOrb;
  ctx.fillRect(0, 0, width, height);

  const bottomOrb = ctx.createRadialGradient(
    width - 160,
    height - 180,
    10,
    width - 160,
    height - 180,
    550
  );
  bottomOrb.addColorStop(0, 'rgba(5, 150, 105, 0.12)');
  bottomOrb.addColorStop(1, 'rgba(5, 150, 105, 0)');
  ctx.fillStyle = bottomOrb;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Outer border with subtle emerald glow
  ctx.save();
  ctx.strokeStyle = '#d1fae5';
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, width - 48, height - 48, 38);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, 32, 32, width - 64, height - 64, 32);
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------
  // 2. HEADER SECTION (Brand: My Magic Numbers)
  // -------------------------------------------------------------
  const headerY = isStory ? 90 : 60;
  const paddingX = 80;
  const logoSize = isStory ? 76 : 64;

  // Background icon box
  ctx.save();
  ctx.fillStyle = '#16a34a';
  ctx.shadowColor = 'rgba(22, 163, 74, 0.3)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, paddingX, headerY, logoSize, logoSize, isStory ? 20 : 16);
  ctx.fill();
  ctx.restore();

  // Clover in logo box
  drawCloverLogo(
    ctx,
    paddingX + logoSize / 2,
    headerY + logoSize / 2 - 2,
    logoSize * 0.58,
    '#ffffff'
  );

  // Title: My Magic Numbers
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${isStory ? 46 : 38}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText('My Magic Numbers', paddingX + logoSize + 22, headerY + (isStory ? 42 : 36));

  // "Swiss Lotto" Pill (dynamically positioned after title)
  const titleWidth = ctx.measureText('My Magic Numbers').width;
  const pillX = paddingX + logoSize + 22 + titleWidth + 16;
  const pillY = headerY + (isStory ? 14 : 10);
  ctx.fillStyle = '#ecfdf5';
  roundRect(ctx, pillX, pillY, 136, 36, 10);
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillY, 136, 36, 10);
  ctx.stroke();

  ctx.fillStyle = '#047857';
  ctx.font = '700 16px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Swiss Lotto', pillX + 68, pillY + 24);

  // Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    i18n.subtitle,
    paddingX + logoSize + 22,
    headerY + (isStory ? 74 : 64)
  );

  // Info stats bar pill
  const infoY = headerY + (isStory ? 108 : 90);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, paddingX, infoY, width - paddingX * 2, 44, 12);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Green pulse dot
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(paddingX + 26, infoY + 22, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.font = '600 16px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    i18n.drawsAnalyzed(summary.drawsCount, startYear),
    paddingX + 44,
    infoY + 28
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.fillText(i18n.costPerGrid, width - paddingX - 24, infoY + 28);
  ctx.restore();

  // -------------------------------------------------------------
  // 3. TICKET ANALYSÉ CARD (Exact match to .ticket-panel-light)
  // -------------------------------------------------------------
  const cardX = paddingX;
  const cardY = isStory ? 285 : 215;
  const cardW = width - paddingX * 2;
  const cardH = isStory ? 370 : 255;

  ctx.save();
  // Card base: linear-gradient(135deg, #ffffff 0%, #f4f8f4 100%)
  const ticketBg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  ticketBg.addColorStop(0, '#ffffff');
  ticketBg.addColorStop(1, '#f4f8f4');
  ctx.fillStyle = ticketBg;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();

  ctx.strokeStyle = '#d1fae5';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.stroke();

  // Shadow
  ctx.shadowColor = 'rgba(22, 163, 74, 0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.restore();

  // Card Header: TICKET ANALYSÉ + Chance Badge
  ctx.save();
  ctx.fillStyle = '#166534';
  ctx.font = '800 16px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.ticketAnalyzed, cardX + 36, cardY + 44);

  // Chance Pill Badge
  const chanceBadgeW = 120;
  const chanceBadgeX = cardX + cardW - chanceBadgeW - 36;
  const chanceBadgeY = cardY + 24;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, chanceBadgeX, chanceBadgeY, chanceBadgeW, 34, 17);
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, chanceBadgeX, chanceBadgeY, chanceBadgeW, 34, 17);
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = '700 15px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(i18n.chanceBadge(bonus), chanceBadgeX + chanceBadgeW / 2, chanceBadgeY + 23);
  ctx.restore();

  // Draw the balls (6 emerald balls + 1 dark forest chance ball)
  const ballY = cardY + (isStory ? 140 : 105);
  const ballRadius = isStory ? 48 : 38;
  const ballStartX = cardX + 40 + ballRadius;
  const totalBalls = 7;
  const availableW = cardW - 80 - ballRadius * 2;
  const spacing = availableW / (totalBalls - 1);

  // 6 Main Emerald Balls
  numbers.slice(0, 6).forEach((num, i) => {
    const cx = ballStartX + i * spacing;

    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(22, 163, 74, 0.35)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    // Green Gradient
    const ballGrad = ctx.createRadialGradient(
      cx - ballRadius * 0.3,
      ballY - ballRadius * 0.3,
      ballRadius * 0.1,
      cx,
      ballY,
      ballRadius
    );
    ballGrad.addColorStop(0, '#22c55e');
    ballGrad.addColorStop(0.6, '#16a34a');
    ballGrad.addColorStop(1, '#15803d');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(cx, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle highlight rim
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bold White Number
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${isStory ? 40 : 32}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), cx, ballY + 2);
    ctx.restore();
  });

  // 7th Chance Ball (Dark Green #064e3b like in Composez votre chance)
  {
    const cx = ballStartX + 6 * spacing;

    ctx.save();
    ctx.shadowColor = 'rgba(6, 78, 59, 0.4)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    const chanceGrad = ctx.createRadialGradient(
      cx - ballRadius * 0.3,
      ballY - ballRadius * 0.3,
      ballRadius * 0.1,
      cx,
      ballY,
      ballRadius
    );
    chanceGrad.addColorStop(0, '#065f46');
    chanceGrad.addColorStop(0.7, '#064e3b');
    chanceGrad.addColorStop(1, '#022c22');

    ctx.fillStyle = chanceGrad;
    ctx.beginPath();
    ctx.arc(cx, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${isStory ? 40 : 32}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(bonus), cx, ballY + 2);

    // Mini Chance tag below ball
    ctx.font = '700 12px Inter, -apple-system, sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText(i18n.chanceBall, cx, ballY + ballRadius + 18);
    ctx.restore();
  }

  // Dashed separator line
  const dashY = ballY + (isStory ? 100 : 72);
  ctx.save();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(cardX + 36, dashY);
  ctx.lineTo(cardX + cardW - 36, dashY);
  ctx.stroke();
  ctx.restore();

  // Sub-row: MEILLEUR GAIN & TIRAGES GAGNANTS
  const metricY = dashY + (isStory ? 36 : 28);
  ctx.save();
  // Left: Meilleur gain
  ctx.fillStyle = '#64748b';
  ctx.font = '700 13px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.bestWin, cardX + 36, metricY);

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${isStory ? 34 : 26}px Inter, -apple-system, sans-serif`;
  ctx.fillText(
    summary.bestDraw ? formatCHF(summary.bestDraw.amount) : 'CHF 0.–',
    cardX + 36,
    metricY + (isStory ? 38 : 28)
  );

  if (summary.bestDraw) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px Inter, -apple-system, sans-serif';
    ctx.fillText(
      i18n.onDate(formatCanvasDate(summary.bestDraw.date, lang)),
      cardX + 36,
      metricY + (isStory ? 64 : 48)
    );
  }

  // Right: Tirages gagnants
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 13px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.winningDraws, cardX + cardW - 36, metricY);

  ctx.fillStyle = '#16a34a';
  ctx.font = `800 ${isStory ? 34 : 26}px Inter, -apple-system, sans-serif`;
  ctx.fillText(String(summary.winningDrawsCount), cardX + cardW - 36, metricY + (isStory ? 38 : 28));

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px Inter, -apple-system, sans-serif';
  ctx.fillText(
    i18n.outOfDraws(summary.drawsCount),
    cardX + cardW - 36,
    metricY + (isStory ? 64 : 48)
  );
  ctx.restore();

  // -------------------------------------------------------------
  // 4. METRIC CARDS: GAINS CUMULÉS & BILAN NET (Exact .metric-card)
  // -------------------------------------------------------------
  const row2Y = cardY + cardH + 28;
  const colGap = 20;
  const colW = (cardW - colGap) / 2;
  const colH = isStory ? 200 : 145;

  // --- CARD 1: GAINS CUMULÉS ---
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cardX, row2Y, colW, colH, 24);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, row2Y, colW, colH, 24);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '700 14px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.totalWinnings, cardX + 28, row2Y + 36);

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${isStory ? 44 : 34}px Inter, -apple-system, sans-serif`;
  ctx.fillText(formatCHF(summary.totalWinnings), cardX + 28, row2Y + (isStory ? 94 : 76));

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px Inter, -apple-system, sans-serif';
  ctx.fillText(
    i18n.winsSummary(summary.winningDrawsCount, summary.drawsCount),
    cardX + 28,
    row2Y + (isStory ? 144 : 114)
  );
  ctx.restore();

  // --- CARD 2: BILAN NET ---
  const col2X = cardX + colW + colGap;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, col2X, row2Y, colW, colH, 24);
  ctx.fill();
  ctx.strokeStyle = isLoss ? '#fecaca' : '#bbf7d0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, col2X, row2Y, colW, colH, 24);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '700 14px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.netProfit, col2X + 28, row2Y + 36);

  ctx.fillStyle = isLoss ? '#dc2626' : '#16a34a';
  ctx.font = `800 ${isStory ? 44 : 34}px Inter, -apple-system, sans-serif`;
  ctx.fillText(formatCHF(summary.netProfit), col2X + 28, row2Y + (isStory ? 94 : 76));

  ctx.fillStyle = isLoss ? '#ef4444' : '#15803d';
  ctx.font = '600 15px Inter, -apple-system, sans-serif';
  ctx.fillText(
    `ROI ${summary.roiPercentage >= 0 ? '+' : ''}${summary.roiPercentage.toFixed(1)}%`,
    col2X + 28,
    row2Y + (isStory ? 144 : 114)
  );
  ctx.restore();

  // -------------------------------------------------------------
  // 5. ETF COMPARISON CARD (Theme: .etf-card)
  // -------------------------------------------------------------
  const etfY = row2Y + colH + 28;
  const etfH = isStory ? 370 : 255;

  // Approximate realistic DCA ETF return (~7% per year)
  const years = (2026 - parseInt(startYear, 10)) || 13;
  const etfEstimated = Math.round(summary.totalCost * Math.pow(1.07, years * 0.52));
  const etfGain = Math.round(etfEstimated - summary.totalCost);
  const diffManquee = Math.round(etfGain - summary.netProfit);

  ctx.save();
  // Card base
  const etfBg = ctx.createLinearGradient(cardX, etfY, cardX + cardW, etfY + etfH);
  etfBg.addColorStop(0, '#ffffff');
  etfBg.addColorStop(0.4, '#f8faf9');
  etfBg.addColorStop(1, '#f0f5f1');
  ctx.fillStyle = etfBg;
  roundRect(ctx, cardX, etfY, cardW, etfH, 28);
  ctx.fill();

  ctx.strokeStyle = '#d1d9d4';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, etfY, cardW, etfH, 28);
  ctx.stroke();

  // Green topbar accent line cleanly clipped to top corners
  ctx.save();
  roundRect(ctx, cardX, etfY, cardW, etfH, 28);
  ctx.clip();
  const topGrad = ctx.createLinearGradient(cardX, etfY, cardX + cardW, etfY);
  topGrad.addColorStop(0, '#16a34a');
  topGrad.addColorStop(0.5, '#22c55e');
  topGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = topGrad;
  ctx.fillRect(cardX, etfY, cardW, 6);
  ctx.restore();

  // Title row
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${isStory ? 24 : 20}px Inter, -apple-system, sans-serif`;
  ctx.fillText(i18n.etfTitle, cardX + 36, etfY + (isStory ? 48 : 38));

  ctx.fillStyle = '#64748b';
  ctx.font = '500 15px Inter, -apple-system, sans-serif';
  ctx.fillText(
    i18n.etfSubtitle,
    cardX + 36,
    etfY + (isStory ? 76 : 62)
  );

  // 2 Sub-boxes: Swiss Lotto vs ETF Monde
  const boxY = etfY + (isStory ? 108 : 86);
  const boxW = (cardW - 72 - 20) / 2;
  const boxH = isStory ? 130 : 85;

  // Box 1: Swiss Lotto
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  roundRect(ctx, cardX + 36, boxY, boxW, boxH, 16);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  roundRect(ctx, cardX + 36, boxY, boxW, boxH, 16);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '700 14px Inter, -apple-system, sans-serif';
  ctx.fillText('🎰 Swiss Lotto', cardX + 52, boxY + 30);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.lottoBets(formatCHF(summary.totalCost)), cardX + 52, boxY + (isStory ? 60 : 50));

  ctx.fillStyle = isLoss ? '#dc2626' : '#16a34a';
  ctx.font = '700 15px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.lottoNet(formatCHF(summary.netProfit)), cardX + 52, boxY + (isStory ? 94 : 70));

  // Box 2: ETF Monde (VT 7%/an)
  const box2X = cardX + 36 + boxW + 20;
  ctx.fillStyle = 'rgba(240, 253, 244, 0.9)';
  roundRect(ctx, box2X, boxY, boxW, boxH, 16);
  ctx.fill();
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1;
  roundRect(ctx, box2X, boxY, boxW, boxH, 16);
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = '700 14px Inter, -apple-system, sans-serif';
  ctx.fillText('📈 ETF Monde (VT 7%/an)', box2X + 16, boxY + 30);

  ctx.fillStyle = '#047857';
  ctx.font = '500 13px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.etfEstimated(formatCHF(etfEstimated)), box2X + 16, boxY + (isStory ? 60 : 50));

  ctx.fillStyle = '#15803d';
  ctx.font = '700 15px Inter, -apple-system, sans-serif';
  ctx.fillText(i18n.etfNetGain(formatCHF(etfGain)), box2X + 16, boxY + (isStory ? 94 : 70));

  // Banner: Différence manquée
  const bannerY = boxY + boxH + (isStory ? 24 : 16);
  ctx.fillStyle = '#ecfdf5';
  roundRect(ctx, cardX + 36, bannerY, cardW - 72, isStory ? 70 : 48, 14);
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX + 36, bannerY, cardW - 72, isStory ? 70 : 48, 14);
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = `700 ${isStory ? 18 : 15}px Inter, -apple-system, sans-serif`;
  ctx.fillText(i18n.missedDiff, cardX + 54, bannerY + (isStory ? 42 : 30));

  ctx.textAlign = 'right';
  ctx.fillStyle = '#047857';
  ctx.font = `800 ${isStory ? 24 : 18}px Inter, -apple-system, sans-serif`;
  ctx.fillText(`+${formatCHF(diffManquee)}`, cardX + cardW - 54, bannerY + (isStory ? 43 : 30));
  ctx.restore();

  // -------------------------------------------------------------
  // 6. PUNCHLINE / HUMOUR & FOOTER
  // -------------------------------------------------------------
  if (isStory) {
    const punchY = etfY + etfH + 34;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, punchY, cardW, 110, 20);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cardX, punchY, cardW, 110, 20);
    ctx.stroke();

    const punchline = isLoss ? i18n.punchlineLoss : i18n.punchlineWin;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 700 20px Inter, -apple-system, sans-serif';
    ctx.fillText(punchline, width / 2, punchY + 48);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 15px Inter, -apple-system, sans-serif';
    ctx.fillText(i18n.challengeFriends, width / 2, punchY + 80);
    ctx.restore();

    // Footer Branding
    const footerY = punchY + 140;

    ctx.save();
    // Pill button
    ctx.fillStyle = '#16a34a';
    ctx.shadowColor = 'rgba(22, 163, 74, 0.25)';
    ctx.shadowBlur = 20;
    roundRect(ctx, width / 2 - 200, footerY, 400, 58, 29);
    ctx.fill();

    // White clover in button
    drawCloverLogo(ctx, width / 2 - 130, footerY + 29, 28, '#ffffff');

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('mymagicnumbers.com', width / 2 + 12, footerY + 37);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 18px Inter, -apple-system, sans-serif';
    ctx.fillText(i18n.footerStory, width / 2, footerY + 104);
    ctx.restore();
  } else {
    // Square mode footer
    const footerY = etfY + etfH + 20;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#16a34a';
    ctx.font = '800 22px Inter, -apple-system, sans-serif';
    ctx.fillText('🍀 mymagicnumbers.com', width / 2, footerY + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px Inter, -apple-system, sans-serif';
    ctx.fillText(i18n.footerSquare, width / 2, footerY + 52);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

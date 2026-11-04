const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('[SEO Generator] dist/index.html does not exist. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

const pages = [
  {
    dir: 'loto-francais',
    title: 'Loto FDJ : Vos numéros sont-ils déjà sortis ? | Simulateur gains depuis 2008',
    description:
      'Vérifier si mes numéros sont déjà sortis au Loto FDJ : simulateur officiel de gains rétroactif depuis 2008 (Loto classique, Super Loto, Grand Loto). Testez vos chances et votre rentabilité !',
    ogTitle: 'Loto FDJ : Vos numéros sont-ils déjà sortis ? | My Magic Numbers',
    ogDescription:
      'Simulateur gains Loto depuis 2008 : testez vos 5 numéros et votre numéro Chance face à plus de 2 800 tirages officiels de la FDJ.',
    canonical: 'https://mymagicnumbers.com/loto-francais',
    jsonLdName: 'Simulateur Loto FDJ',
    jsonLdDescription:
      'Simulateur rétrospectif des tirages officiels du Loto FDJ depuis 2008. Vérifiez vos numéros face à l’historique officiel.',
    currency: 'EUR',
  },
  {
    dir: 'loto',
    aliasOf: 'loto-francais',
    title: 'Loto FDJ : Vos numéros sont-ils déjà sortis ? | Simulateur gains depuis 2008',
    description:
      'Vérifier si mes numéros sont déjà sortis au Loto FDJ : simulateur officiel de gains rétroactif depuis 2008 (Loto classique, Super Loto, Grand Loto). Testez vos chances et votre rentabilité !',
    ogTitle: 'Loto FDJ : Vos numéros sont-ils déjà sortis ? | My Magic Numbers',
    ogDescription:
      'Simulateur gains Loto depuis 2008 : testez vos 5 numéros et votre numéro Chance face à plus de 2 800 tirages officiels de la FDJ.',
    canonical: 'https://mymagicnumbers.com/loto-francais',
    jsonLdName: 'Simulateur Loto FDJ',
    jsonLdDescription:
      'Simulateur rétrospectif des tirages officiels du Loto FDJ depuis 2008. Vérifiez vos numéros face à l’historique officiel.',
    currency: 'EUR',
  },
  {
    dir: 'euromillions',
    title: 'EuroMillions : Vos numéros sont-ils déjà sortis ? | Simulateur gains depuis 2004',
    description:
      'Testez vos 5 numéros et 2 étoiles face à tous les tirages officiels de l’EuroMillions depuis 2004. Calculez vos gains réels et votre rentabilité face à l’histoire officielle !',
    ogTitle: 'Simulateur Gains EuroMillions depuis 2004 | My Magic Numbers',
    ogDescription:
      'Découvrez ce que vos 5 numéros et 2 étoiles auraient réellement rapporté face à l’historique officiel complet de l’EuroMillions.',
    canonical: 'https://mymagicnumbers.com/euromillions',
    jsonLdName: 'Simulateur EuroMillions',
    jsonLdDescription:
      'Simulateur officiel rétroactif de l’EuroMillions depuis 2004. Analysez vos numéros et étoiles face à tous les tirages.',
    currency: 'EUR',
  },
  {
    dir: 'swiss-lotto',
    title: 'Swiss Lotto : Vos numéros sont-ils déjà sortis ? | Simulateur historique Swisslos',
    description:
      'Découvrez ce que vos numéros fétiches auraient réellement rapporté face à l’historique officiel complet du Swiss Lotto depuis 2013 (42 numéros + 6 numéros chance).',
    ogTitle: 'Simulateur historique Swiss Lotto | My Magic Numbers',
    ogDescription:
      'Découvrez ce que vos numéros fétiches auraient réellement rapporté face à l’historique complet du Swiss Lotto.',
    canonical: 'https://mymagicnumbers.com/swiss-lotto',
    jsonLdName: 'Simulateur Swiss Lotto',
    jsonLdDescription:
      'Simulateur historique et rétroactif du Swiss Lotto depuis 2013. Comparez vos gains avec un investissement passif en ETF.',
    currency: 'CHF',
  },
];

for (const page of pages) {
  let html = template;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${page.description}" />`
  );

  // Replace OpenGraph
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${page.ogTitle}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${page.ogDescription}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${page.canonical}" />`
  );

  // Replace Twitter
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${page.ogTitle}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${page.ogDescription}" />`
  );

  // Replace Canonical
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/,
    `<link rel="canonical" href="${page.canonical}" />`
  );

  // Create directory in dist
  const targetDir = path.join(distDir, page.dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, html, 'utf8');
  console.log(`[SEO Generator] Created pre-rendered page: ${page.dir}/index.html`);
}

console.log('[SEO Generator] All SEO landing pages generated successfully.');


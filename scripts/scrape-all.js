const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.lottomania.ch/swisslotto.php';
const START_YEAR = 2013;
const END_YEAR = 2026;

// Gain moyen estimé en CHF par rang (base officielle Swisslos)
const ESTIMATED_PAYOUTS = {
    rank6_1: 1500000.0, // 6 + Chance (Jackpot min.)
    rank6_0: 1000000.0, // 6
    rank5_1: 8500.0,    // 5 + Chance
    rank5_0: 1000.0,    // 5
    rank4_1: 140.0,     // 4 + Chance
    rank4_0: 75.0,      // 4
    rank3_1: 25.0,      // 3 + Chance
    rank3_0: 10.0       // 3
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchYear(year) {
    const body = new URLSearchParams({ sdate: year.toString() });

    const response = await axios.post(URL, body.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const yearDraws = [];

    // La première table contient l'historique des tirages
    $('table').first().find('tr').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length >= 8) {
            const rawDate = $(cols[0]).text().trim();

            // Vérifie que la première cellule est bien une date (DD-MM-YYYY)
            if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
                const [day, month, y] = rawDate.split('-');
                const isoDate = `${y}-${month}-${day}`;

                const numbers = [];
                for (let i = 1; i <= 6; i++) {
                    numbers.push(parseInt($(cols[i]).text().trim(), 10));
                }

                const bonus = parseInt($(cols[7]).text().trim(), 10);
                const joker = cols.length >= 9 ? $(cols[8]).text().trim() : null;
                const replay = cols.length >= 10 ? parseInt($(cols[9]).text().trim(), 10) : null;

                yearDraws.push({
                    id: `${isoDate}-swisslotto`,
                    date: isoDate,
                    numbers: numbers.sort((a, b) => a - b),
                    bonus: bonus,
                    joker: joker,
                    replay: replay,
                    payouts: ESTIMATED_PAYOUTS
                });
            }
        }
    });

    return yearDraws;
}

async function run() {
    let allDraws = [];
    console.log(`Début de l'extraction Swiss Lotto (${START_YEAR} -> ${END_YEAR})...\n`);

    for (let year = END_YEAR; year >= START_YEAR; year--) {
        process.stdout.write(`Extraction de l'année ${year}... `);
        try {
            const draws = await fetchYear(year);
            allDraws = allDraws.concat(draws);
            console.log(`OK (${draws.length} tirages)`);
        } catch (err) {
            console.log(`ERREUR : ${err.message}`);
        }
        // Pause de 400ms pour éviter tout blocage IP
        await sleep(400);
    }

    // Tri par date décroissante (tirages les plus récents en premier)
    allDraws.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Création du dossier cible si inexistant
    const targetDir = path.join(__dirname, 'src', 'data');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const outputPath = path.join(targetDir, 'draws.json');
    fs.writeFileSync(outputPath, JSON.stringify(allDraws, null, 2), 'utf-8');

    console.log(`\nSuccès total : ${allDraws.length} tirages enregistrés dans ${outputPath}`);
}

run();
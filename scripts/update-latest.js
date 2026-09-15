// scripts/update-latest.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.lottomania.ch/swisslotto.php';
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'draws.json');

const ESTIMATED_PAYOUTS = {
  rank6_1: 1500000.0,
  rank6_0: 1000000.0,
  rank5_1: 8500.0,
  rank5_0: 1000.0,
  rank4_1: 140.0,
  rank4_0: 75.0,
  rank3_1: 25.0,
  rank3_0: 10.0
};

async function updateDraws() {
  const currentYear = new Date().getFullYear();
  const body = new URLSearchParams({ sdate: currentYear.toString() });

  const { data } = await axios.post(URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const $ = cheerio.load(data);
  const existingDraws = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const existingDates = new Set(existingDraws.map(d => d.date));

  let addedCount = 0;

  $('table').first().find('tr').each((_, row) => {
    const cols = $(row).find('td');
    if (cols.length >= 8) {
      const rawDate = $(cols[0]).text().trim();
      if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
        const [day, month, y] = rawDate.split('-');
        const isoDate = `${y}-${month}-${day}`;

        if (!existingDates.has(isoDate)) {
          const numbers = [];
          for (let i = 1; i <= 6; i++) {
            numbers.push(parseInt($(cols[i]).text().trim(), 10));
          }
          const bonus = parseInt($(cols[7]).text().trim(), 10);

          existingDraws.unshift({
            id: `${isoDate}-swisslotto`,
            date: isoDate,
            numbers: numbers.sort((a, b) => a - b),
            bonus: bonus,
            payouts: ESTIMATED_PAYOUTS
          });
          existingDates.add(isoDate);
          addedCount++;
        }
      }
    }
  });

  if (addedCount > 0) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(existingDraws, null, 2), 'utf-8');
    console.log(`${addedCount} nouveau(x) tirage(s) ajouté(s).`);
  } else {
    console.log("Aucun nouveau tirage disponible.");
  }
}

updateDraws();

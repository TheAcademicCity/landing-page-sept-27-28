const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'js', 'country-codes-data.js');

async function main() {
  const res = await fetch(
    'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json',
  );
  const countries = await res.json();
  const items = countries
    .filter((c) => c.phonecode && String(c.phonecode).trim() !== '')
    .map((c) => {
      const raw = String(c.phonecode).replace(/^\+/, '').split(/[,;]/)[0].trim();
      const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
      if (!digits) return null;
      return {
        iso2: c.iso2,
        name: c.name,
        dial: '+' + digits,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const india = items.find((x) => x.iso2 === 'IN');
  const ordered = india ? [india].concat(items.filter((x) => x.iso2 !== 'IN')) : items;

  const body =
    '/* ISO countries with ITU dial codes (source: dr5hn countries DB). Regenerate: node scripts/generate-country-codes.js */\n' +
    '(function (global) {\n' +
    '  global.COUNTRY_DIAL_CODES = ' +
    JSON.stringify(ordered) +
    ';\n' +
    '})(typeof window !== "undefined" ? window : global);\n';

  fs.writeFileSync(outPath, body, 'utf8');
  console.log('Wrote', ordered.length, 'entries to', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

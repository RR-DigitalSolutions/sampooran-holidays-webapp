const http = require('http');

function get(url, label) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          console.log(`\n✅ [${res.statusCode}] ${label}`);
          if (j.hotels) {
            console.log(`   hotels: ${j.hotels.length}, total: ${j.total}`);
            j.hotels.slice(0, 3).forEach(h =>
              console.log(`   → ${h.name} | primaryImg: ${h.primaryImageUrl ? '✅ ' + h.primaryImageUrl.substring(0, 60) : '❌ none'}`)
            );
          }
          if (j.suggestions) {
            console.log(`   suggestions: ${j.suggestions.length}`);
            j.suggestions.forEach(s => console.log(`   💡 ${s.type}: ${s.name} → ${s.href}`));
          }
        } catch (e) {
          console.log(`❌ [${res.statusCode}] ${label}: ${d.substring(0, 100)}`);
        }
        resolve();
      });
    });
    req.on('error', e => { console.log(`❌ ${label}: ${e.message}`); resolve(); });
    req.setTimeout(8000, () => { console.log(`⏱ ${label}: TIMEOUT`); req.destroy(); resolve(); });
  });
}

(async () => {
  await get('http://localhost:8080/api/hotels/by-location?country=india&state=himachal-pradesh', 'by-location: Himachal Pradesh');
  await get('http://localhost:8080/api/hotels/by-location?country=india&state=himachal-pradesh&city=manali', 'by-location: Manali');
  await get('http://localhost:8080/api/search/hotels?q=manali', 'smart-search: "manali"');
  await get('http://localhost:8080/api/search/hotels?q=resort', 'smart-search: "resort"');
  await get('http://localhost:8080/api/search/hotels?q=manaali', 'smart-search: "manaali" (typo test)');
  console.log('\nDone.');
})();

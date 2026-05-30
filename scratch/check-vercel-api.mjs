// Extract exact API URL from Vercel chunks
async function main() {
  const baseUrl = 'https://sampooran-holidays-webapp-frontend.vercel.app';
  const html = await fetch(baseUrl + '/').then(r => r.text());
  const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"'\s]+/g)].map(m => m[0]);
  
  for (const chunk of chunks.slice(0, 30)) {
    try {
      const text = await fetch(baseUrl + chunk).then(r => r.text());
      if (text.includes('onrender.com')) {
        // Get context around the match
        const idx = text.indexOf('onrender.com');
        const start = Math.max(0, idx - 100);
        const end = Math.min(text.length, idx + 100);
        const context = text.slice(start, end);
        console.log('Context around onrender.com in', chunk.slice(-40));
        console.log(context);
        console.log('---');
        break;
      }
    } catch (e) {}
  }
}

main().catch(console.error);

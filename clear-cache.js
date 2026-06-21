// Clear Redis cache for hotel endpoints so fresh data loads from DB
require('dotenv').config();

const redis = require('ioredis');
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) { console.error('REDIS_URL not set'); process.exit(1); }

const client = new redis(redisUrl, { tls: {}, lazyConnect: false });

client.on('connect', async () => {
  try {
    console.log('Connected to Redis (Upstash)');
    // Find all hotel-related cache keys
    const stream = client.scanStream({ match: 'cache:/api/hotels*', count: 100 });
    const keysToDelete = [];

    stream.on('data', keys => { keysToDelete.push(...keys); });
    stream.on('end', async () => {
      if (keysToDelete.length > 0) {
        await client.del(...keysToDelete);
        console.log(`✅ Cleared ${keysToDelete.length} hotel cache keys:`);
        keysToDelete.forEach(k => console.log(`   - ${k}`));
      } else {
        console.log('No hotel cache keys found (cache may already be empty or using different prefix)');
      }

      // Also scan for search cache
      const stream2 = client.scanStream({ match: 'cache:/api/search*', count: 100 });
      const searchKeys = [];
      stream2.on('data', k => searchKeys.push(...k));
      stream2.on('end', async () => {
        if (searchKeys.length > 0) {
          await client.del(...searchKeys);
          console.log(`✅ Cleared ${searchKeys.length} search cache keys`);
        }
        client.disconnect();
        console.log('\nCache flush complete!');
      });
    });
  } catch (e) {
    console.error('Error:', e.message);
    client.disconnect();
  }
});

client.on('error', e => { console.error('Redis connection error:', e.message); process.exit(1); });

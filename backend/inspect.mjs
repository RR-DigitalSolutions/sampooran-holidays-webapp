import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true'
});

async function inspect() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query('SELECT name, slug, itinerary FROM packages WHERE slug = $1', ['manali-honeymoon-special']);
    if (res.rows.length === 0) {
      console.log('Package not found');
      return;
    }
    const row = res.rows[0];
    console.log(`Package Name: ${row.name}`);
    console.log(`Slug: ${row.slug}`);
    console.log(`Itinerary: ${JSON.stringify(row.itinerary, null, 2)}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspect();

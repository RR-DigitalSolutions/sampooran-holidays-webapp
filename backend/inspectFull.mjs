import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true'
});

async function inspectFull() {
  try {
    await client.connect();
    const res = await client.query('SELECT name, slug, destination_id, destination_ids, itinerary FROM packages WHERE slug = $1', ['manali-honeymoon-special']);
    if (res.rows.length === 0) {
      console.log('Package not found');
      return;
    }
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectFull();

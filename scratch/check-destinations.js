const { Client } = require('pg');

const conn = 'postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true';
const sql = `
  SELECT d.id, d.name, d.slug, d.package_page_slug, s.slug as state_slug, s.name as state_name, c.slug as country_slug, c.name as country_name, d.is_active
  FROM public.destinations d
  LEFT JOIN public.states s ON d.state_id = s.id
  LEFT JOIN public.countries c ON s.country_id = c.id
  WHERE d.slug IN ('manali', 'shimla', 'leh') OR d.package_page_slug IN ('manali', 'shimla', 'leh')
  ORDER BY d.id
`;

(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const result = await client.query(sql);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

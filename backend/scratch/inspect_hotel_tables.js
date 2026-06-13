import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    console.log('--- COLUMNS FOR hotel_rooms ---');
    const colsRooms = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'hotel_rooms'
    `);
    colsRooms.rows.forEach(r => console.log(`${r.column_name} (${r.data_type}) - Default: ${r.column_default}`));

    console.log('\n--- COLUMNS FOR hotel_room_inventory ---');
    const colsInv = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'hotel_room_inventory'
    `);
    colsInv.rows.forEach(r => console.log(`${r.column_name} (${r.data_type}) - Default: ${r.column_default}`));

    console.log('\n--- RECENT INVENTORY ENTRIES ---');
    const invEntries = await client.query(`
      SELECT id, room_id, date, available_count, price_override, is_blocked, discount_type, discount_percent, discount_flat 
      FROM hotel_room_inventory 
      ORDER BY id DESC LIMIT 5
    `);
    console.log(JSON.stringify(invEntries.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();

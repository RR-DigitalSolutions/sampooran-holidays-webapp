import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const roomCols = [
      ["discount_type", "TEXT DEFAULT 'PERCENT'"],
      ["discount_percent", "INTEGER DEFAULT 0"],
      ["discount_flat", "INTEGER DEFAULT 0"]
    ];

    for (const [col, def] of roomCols) {
      const check = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='hotel_rooms' AND column_name=$1
      `, [col]);

      if (check.rows.length === 0) {
        console.log(`Adding ${col} to hotel_rooms...`);
        await client.query(`ALTER TABLE hotel_rooms ADD COLUMN ${col} ${def}`);
        console.log(`Added ${col} successfully.`);
      } else {
        console.log(`Column ${col} already exists in hotel_rooms.`);
      }
    }

    const invCols = [
      ["discount_type", "TEXT DEFAULT 'PERCENT'"],
      ["discount_percent", "INTEGER DEFAULT 0"],
      ["discount_flat", "INTEGER DEFAULT 0"]
    ];

    for (const [col, def] of invCols) {
      const check = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='hotel_room_inventory' AND column_name=$1
      `, [col]);

      if (check.rows.length === 0) {
        console.log(`Adding ${col} to hotel_room_inventory...`);
        await client.query(`ALTER TABLE hotel_room_inventory ADD COLUMN ${col} ${def}`);
        console.log(`Added ${col} successfully.`);
      } else {
        console.log(`Column ${col} already exists in hotel_room_inventory.`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();

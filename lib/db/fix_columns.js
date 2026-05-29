import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../../.env' });

const { Client } = pg;

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add columns to home_page_categories
    const columns = [
      ['slug', 'TEXT UNIQUE'],
      ['description', 'TEXT'],
      ['content', 'TEXT'],
      ['image_url', 'TEXT'],
      ['meta_title', 'TEXT'],
      ['meta_description', 'TEXT'],
      ['meta_keywords', 'TEXT']
    ];

    for (const [name, type] of columns) {
      try {
        await client.query(`ALTER TABLE home_page_categories ADD COLUMN ${name} ${type}`);
        console.log(`Added column ${name} to home_page_categories`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`Column ${name} already exists`);
        } else {
          console.error(`Error adding column ${name}:`, err.message);
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();

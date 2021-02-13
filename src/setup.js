import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import pg from 'pg';

dotenv.config();

const {
  DATABASE_URL: connectionString,
} = process.env;

const readFileAsync = util.promisify(fs.readFile);

async function query(q) {
  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q);

    const { rows } = result;
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  // droppa töflu ef til
  await query('DROP TABLE IF EXISTS signatures');
  console.info('Töflu eytt');

  // búa til töflu út frá skema
  try {
    const createTable = await readFileAsync('./sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  // bæta færslum við töflu
  try {
    const insert = await readFileAsync('./sql/fake.sql');
    await query(insert.toString('utf8'));
    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});

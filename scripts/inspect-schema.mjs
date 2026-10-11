import pg from "pg";

const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const tables = await c.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_name ILIKE '%drizzle%' OR table_schema = 'drizzle'
  ORDER BY 1, 2
`);
console.log("MIGRATION TABLES", JSON.stringify(tables.rows, null, 2));

const cols = await c.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'properties'
    AND column_name IN ('client_id', 'agent_id')
  ORDER BY column_name
`);
console.log("PROPERTIES COLS", JSON.stringify(cols.rows, null, 2));

const checks = await c.query(`
  SELECT conname, contype
  FROM pg_constraint
  WHERE conname IN (
    'properties_owner_check',
    'properties_client_id_clients_id_fk',
    'inquiries_recipient_check',
    'inquiries_owner_client_id_clients_id_fk'
  )
`);
console.log("CONSTRAINTS", JSON.stringify(checks.rows, null, 2));

const extra = await c.query(`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'agencies' AND column_name IN ('latitude', 'longitude'))
      OR (table_name = 'client_property_statuses' AND column_name = 'linked_for_transaction')
      OR (table_name = 'password_reset_tokens' AND column_name = 'purpose')
      OR (table_name = 'inquiries' AND column_name IN ('owner_client_id', 'agent_id'))
    )
  ORDER BY table_name, column_name
`);
console.log("OTHER COLS", JSON.stringify(extra.rows, null, 2));

try {
  const ledger = await c.query(
    `SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
  );
  console.log("LEDGER", JSON.stringify(ledger.rows, null, 2));
} catch (e) {
  console.log("LEDGER ERR", e.message);
}

await c.end();

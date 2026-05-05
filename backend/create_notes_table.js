import { Pool } from 'pg';

const db = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nezari',
});

try {
  await db.query(`CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);`);
  console.log('✅ notes table created');
} catch (err) {
  console.error('❌ Error creating notes table:', err);
} finally {
  await db.end();
}


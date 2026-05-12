import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import cors from "cors";
import { Pool } from "pg";

const app = express();
const port = 3001;

// 🔌 Connect to PostgreSQL
const db = new Pool({
  connectionString: "postgresql://postgres:123456@localhost:5432/nezari",
});

// 🛠️ Initialize database tables on startup
async function initializeDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    `);

    console.log("✅ Database tables initialized");
  } catch (err) {
    console.error("❌ Failed to initialize database:", err);
  }
}

// Initialize on startup
initializeDatabase();

// 🛠️ Middleware setup
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(
  session({
    secret: "any-random-string-keep-it-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true },
  }),
);

// 📝 Tell TypeScript that req.session can have a userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
};

// ✍️ SIGNUP route
app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: "Missing fields" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password too short" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, hash, name],
    );
    const user = result.rows[0];
    req.session.userId = user.id;
    res.json({ user });
  } catch (err: any) {
    if (err.code === "23505")
      return res.status(409).json({ error: "Email already in use" });
    res.status(500).json({ error: "Signup failed" });
  }
});

// 🔑 LOGIN route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query(
    "SELECT id, email, name, password FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// 👤 ME route — "who am I?"
app.get("/api/me", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  const result = await db.query(
    "SELECT id, email, name FROM users WHERE id = $1",
    [req.session.userId],
  );
  res.json({ user: result.rows[0] });
});

// 🚪 LOGOUT route
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// =====================================================
// 📝 CRUD OPERATIONS FOR NOTES
// =====================================================

// 📌 CREATE - Add a new note
app.post("/api/notes", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ error: "Missing title or content" });
  
  try {
    const result = await db.query(
      "INSERT INTO notes (user_id, title, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, user_id, title, content, created_at",
      [req.session.userId, title, content],
    );
    res.json({ note: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

// 📖 READ - Get all notes for logged-in user
app.get("/api/notes", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  try {
    const result = await db.query(
      "SELECT id, user_id, title, content, created_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
      [req.session.userId],
    );
    res.json({ notes: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// 📖 READ - Get single note by ID
app.get("/api/notes/:id", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { id } = req.params;
  try {
    const result = await db.query(
      "SELECT id, user_id, title, content, created_at FROM notes WHERE id = $1 AND user_id = $2",
      [id, req.session.userId],
    );
    
    if (!result.rows[0])
      return res.status(404).json({ error: "Note not found" });
    
    res.json({ note: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// ✏️ UPDATE - Edit a note
app.put("/api/notes/:id", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { id } = req.params;
  const { title, content } = req.body;
  
  if (!title || !content)
    return res.status(400).json({ error: "Missing title or content" });
  
  try {
    // First check if note belongs to this user
    const checkResult = await db.query(
      "SELECT user_id FROM notes WHERE id = $1",
      [id],
    );
    
    if (!checkResult.rows[0])
      return res.status(404).json({ error: "Note not found" });
    
    if (checkResult.rows[0].user_id !== req.session.userId)
      return res.status(403).json({ error: "Unauthorized: Cannot edit other users' notes" });
    
    // Update the note
    const result = await db.query(
      "UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING id, user_id, title, content, created_at",
      [title, content, id],
    );
    
    res.json({ note: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

// 🗑️ DELETE - Remove a note
app.delete("/api/notes/:id", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { id } = req.params;
  
  try {
    // First check if note belongs to this user
    const checkResult = await db.query(
      "SELECT user_id FROM notes WHERE id = $1",
      [id],
    );
    
    if (!checkResult.rows[0])
      return res.status(404).json({ error: "Note not found" });
    
    if (checkResult.rows[0].user_id !== req.session.userId)
      return res.status(403).json({ error: "Unauthorized: Cannot delete other users' notes" });
    
    // Delete the note
    await db.query("DELETE FROM notes WHERE id = $1", [id]);
    
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// =====================================================
// 👑 ADMIN ROUTES (for supervisor access)
// =====================================================

// 👥 ADMIN: Get all users
app.get("/api/admin/users", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  // Simple admin check: only user ID 1 can access (you can change this)
  if (req.session.userId !== 1)
    return res.status(403).json({ error: "Admin access required" });
  
  try {
    const result = await db.query(
      "SELECT id, email, name, created_at FROM users ORDER BY created_at DESC",
    );
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 📝 ADMIN: Get all notes from all users
app.get("/api/admin/notes", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  // Simple admin check: only user ID 1 can access
  if (req.session.userId !== 1)
    return res.status(403).json({ error: "Admin access required" });
  
  try {
    const result = await db.query(`
      SELECT n.id, n.title, n.content, n.created_at, n.updated_at, 
             u.email, u.name as user_name
      FROM notes n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);
    res.json({ notes: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch all notes" });
  }
});

app.listen(port, () => console.log(`🚀 API on http://localhost:${port}`)); 
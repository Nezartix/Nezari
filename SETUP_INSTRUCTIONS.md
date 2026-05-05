# Setup Instructions for CRUD Features

## Prerequisites
- PostgreSQL running locally
- Node.js installed
- Backend and frontend terminals ready

---

## Step 1: Create the Database Table

### Using pgAdmin (GUI)
1. Open pgAdmin
2. Right-click "Databases" → New → Database
3. Name: `nezari`
4. Right-click on `nezari` → Query Tool
5. Copy and paste the SQL from `backend/setup.sql`
6. Click Execute

### Using Command Line (psql)
```bash
psql -U postgres

# Then in psql:
CREATE DATABASE nezari;

\c nezari  # Connect to database

# Then paste the SQL from backend/setup.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
```

---

## Step 2: Install Dependencies (If Needed)

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## Step 3: Start the Servers

### Terminal 1: Backend
```bash
cd backend
npx tsx server.ts
```

Expected output:
```
🚀 API on http://localhost:3001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v8.0.9  ready in 234 ms

➜  Local:   http://localhost:5173/
```

---

## Step 4: Test in Browser

1. Open http://localhost:5173
2. Sign up with email and password
3. After login, you'll see the home page with "My Notes" section
4. Click "+ New Note" to create a note
5. Enter title and content
6. Click "Save Note"
7. Your note appears in the grid!
8. Click "Edit" to modify
9. Click "Delete" to remove

---

## Step 5: Test APIs with Postman

### 1. Create a Note
```
Method: POST
URL: http://localhost:3001/api/notes
Headers: Content-Type: application/json
Body (raw JSON):
{
  "title": "My First Note",
  "content": "This is awesome!"
}
```

**Response (if successful):**
```json
{
  "note": {
    "id": 1,
    "user_id": 1,
    "title": "My First Note",
    "content": "This is awesome!",
    "created_at": "2026-05-04T10:30:00Z"
  }
}
```

---

### 2. Get All Notes
```
Method: GET
URL: http://localhost:3001/api/notes
Headers: (none needed, browser sends cookies automatically)
Body: (empty)
```

**Response:**
```json
{
  "notes": [
    {
      "id": 1,
      "user_id": 1,
      "title": "My First Note",
      "content": "This is awesome!",
      "created_at": "2026-05-04T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "title": "Second Note",
      "content": "Another one!",
      "created_at": "2026-05-04T11:00:00Z"
    }
  ]
}
```

---

### 3. Get Single Note
```
Method: GET
URL: http://localhost:3001/api/notes/1
```

**Response:**
```json
{
  "note": {
    "id": 1,
    "user_id": 1,
    "title": "My First Note",
    "content": "This is awesome!",
    "created_at": "2026-05-04T10:30:00Z"
  }
}
```

---

### 4. Update a Note
```
Method: PUT
URL: http://localhost:3001/api/notes/1
Headers: Content-Type: application/json
Body (raw JSON):
{
  "title": "Updated Title",
  "content": "Updated content!"
}
```

**Response:**
```json
{
  "note": {
    "id": 1,
    "user_id": 1,
    "title": "Updated Title",
    "content": "Updated content!",
    "created_at": "2026-05-04T10:30:00Z"
  }
}
```

---

### 5. Delete a Note
```
Method: DELETE
URL: http://localhost:3001/api/notes/1
```

**Response:**
```json
{
  "ok": true
}
```

---

## Troubleshooting

### "Not logged in" Error
- Make sure you signed up and logged in first
- Check that cookies are enabled in browser
- In Postman, make sure "Cookies" are enabled

### "Note not found" Error
- The note ID doesn't exist
- Check in database that the note exists

### "Unauthorized" Error
- You're trying to edit/delete someone else's note
- Only the note owner can modify it

### Database Connection Error
- PostgreSQL not running
- Wrong password in connection string
- Database name not `nezari`

### CORS Error
- Frontend and backend on different ports
- CORS is configured to allow localhost:5173

---

## File Changes Summary

### New Files:
- `backend/setup.sql` - Database schema
- `CRUD_GUIDE.md` - Detailed explanation

### Modified Files:
- `backend/server.ts` - Added 5 CRUD endpoints
- `frontend/src/components/Home.tsx` - Added notes UI

### Key Additions:

**Backend Endpoints:**
```
POST   /api/notes        - Create note
GET    /api/notes        - Get all notes
GET    /api/notes/:id    - Get one note
PUT    /api/notes/:id    - Update note
DELETE /api/notes/:id    - Delete note
```

**Frontend Features:**
- View all notes in grid
- Create new notes
- Edit existing notes
- Delete notes
- Real-time updates

---

## Next Steps

You can now:
1. ✅ Create, read, update, delete notes
2. ✅ Add more CRUD resources (e.g., tasks, projects, etc.)
3. ✅ Add search/filter functionality
4. ✅ Add categories or tags
5. ✅ Add sharing features
6. ✅ Deploy to production

---

## Questions?

Refer to `CRUD_GUIDE.md` for detailed explanations of every line of code!

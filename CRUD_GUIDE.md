# Complete CRUD Operations Guide - Nezari App

## What We Added

We added a **Notes Management System** where users can:
- **CREATE** - Write new notes
- **READ** - View their notes
- **UPDATE** - Edit existing notes
- **DELETE** - Remove notes

---

## Step 1: Database Setup

### What's a Database?
A database stores all data permanently. Think of it like a filing cabinet.

### Create the Tables

Run this SQL in PostgreSQL (using pgAdmin or psql):

```sql
-- Users table (already exists)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing ID
  email VARCHAR(255) UNIQUE NOT NULL,  -- Unique email
  password VARCHAR(255) NOT NULL,  -- Encrypted password
  name VARCHAR(255) NOT NULL,      -- User's name
  created_at TIMESTAMP             -- When created
);

-- New: Notes table
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing ID
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
  -- user_id links each note to a user
  -- ON DELETE CASCADE = if user deleted, delete their notes too
  
  title VARCHAR(255) NOT NULL,     -- Note title
  content TEXT NOT NULL,           -- Note content (longer text)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When created
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- When updated
);
```

**What happens:**
- `users` table stores user accounts
- `notes` table stores notes for each user
- `user_id` in notes table connects each note to its owner

---

## Step 2: Backend API Endpoints

All endpoints are in `backend/server.ts`. Here are the CRUD operations:

### 1️⃣ CREATE - Add a New Note

**Endpoint:**
```
POST /api/notes
```

**What it needs:**
- Must be logged in (session check)
- Send JSON with:
  - `title` (required) - Note title
  - `content` (required) - Note content

**Frontend sends:**
```javascript
fetch('http://localhost:3001/api/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Include session cookie
  body: JSON.stringify({ 
    title: 'My First Note', 
    content: 'This is awesome!' 
  })
})
```

**Backend code (Line 113-133):**
```typescript
app.post("/api/notes", async (req, res) => {
  // Step 1: Check if logged in
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  // Step 2: Get title and content from request
  const { title, content } = req.body;
  
  // Step 3: Validate data exists
  if (!title || !content)
    return res.status(400).json({ error: "Missing title or content" });
  
  try {
    // Step 4: Insert into database
    const result = await db.query(
      "INSERT INTO notes (user_id, title, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, user_id, title, content, created_at",
      [req.session.userId, title, content],  // Replace $1, $2, $3
    );
    
    // Step 5: Send back the created note
    res.json({ note: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create note" });
  }
});
```

**Database flow:**
```
User logged in? ✅
Title + Content provided? ✅
     ↓
INSERT INTO notes 
  (user_id: 1, title: 'My First Note', content: '...')
     ↓
Database creates row with new ID
     ↓
Return note to frontend
```

**Response (Success - 200):**
```json
{
  "note": {
    "id": 5,
    "user_id": 1,
    "title": "My First Note",
    "content": "This is awesome!",
    "created_at": "2026-05-04T10:30:00Z"
  }
}
```

---

### 2️⃣ READ - Get All Notes (or One Note)

#### GET ALL NOTES

**Endpoint:**
```
GET /api/notes
```

**What it does:**
- Returns all notes for the logged-in user
- Sorted by newest first

**Backend code (Line 136-152):**
```typescript
app.get("/api/notes", async (req, res) => {
  // Step 1: Check if logged in
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  try {
    // Step 2: Query all notes for this user
    const result = await db.query(
      "SELECT id, user_id, title, content, created_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
      [req.session.userId],  // Only get notes for logged-in user
    );
    // WHERE user_id = $1 = filter by user
    // ORDER BY created_at DESC = newest first
    
    // Step 3: Send all notes back
    res.json({ notes: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});
```

**Database flow:**
```
User logged in? ✅
     ↓
SELECT * FROM notes WHERE user_id = 1
     ↓
Database finds all notes for user 1
     ↓
Sort by date (newest first)
     ↓
Return array of notes
```

**Response (Success - 200):**
```json
{
  "notes": [
    {
      "id": 5,
      "user_id": 1,
      "title": "My First Note",
      "content": "This is awesome!",
      "created_at": "2026-05-04T10:30:00Z"
    },
    {
      "id": 4,
      "user_id": 1,
      "title": "Second Note",
      "content": "Another note...",
      "created_at": "2026-05-03T09:00:00Z"
    }
  ]
}
```

#### GET SINGLE NOTE

**Endpoint:**
```
GET /api/notes/:id
```

**Example:**
```
GET /api/notes/5
```

**Backend code (Line 155-178):**
```typescript
app.get("/api/notes/:id", async (req, res) => {
  // Step 1: Check if logged in
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { id } = req.params;  // Get ID from URL (/api/notes/5)
  
  try {
    // Step 2: Get specific note
    const result = await db.query(
      "SELECT id, user_id, title, content, created_at FROM notes WHERE id = $1 AND user_id = $2",
      [id, req.session.userId],
    );
    // WHERE id = $1 AND user_id = $2 
    // = only get if ID matches AND belongs to this user (security!)
    
    // Step 3: Check if note exists
    if (!result.rows[0])
      return res.status(404).json({ error: "Note not found" });
    
    // Step 4: Send note back
    res.json({ note: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch note" });
  }
});
```

**Database flow:**
```
User logged in? ✅
Note ID provided? ✅
     ↓
SELECT * FROM notes WHERE id = 5 AND user_id = 1
     ↓
Note found AND belongs to user? ✅
     ↓
Return note
```

---

### 3️⃣ UPDATE - Edit a Note

**Endpoint:**
```
PUT /api/notes/:id
```

**What it needs:**
- Must be logged in
- Note ID in URL
- New `title` and `content` in JSON body

**Frontend sends:**
```javascript
fetch('http://localhost:3001/api/notes/5', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ 
    title: 'Updated Title', 
    content: 'Updated content!' 
  })
})
```

**Backend code (Line 181-223):**
```typescript
app.put("/api/notes/:id", async (req, res) => {
  // Step 1: Check if logged in
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { id } = req.params;
  const { title, content } = req.body;
  
  // Step 2: Validate data
  if (!title || !content)
    return res.status(400).json({ error: "Missing title or content" });
  
  try {
    // Step 3: Check if note exists and belongs to user
    const checkResult = await db.query(
      "SELECT user_id FROM notes WHERE id = $1",
      [id],
    );
    
    if (!checkResult.rows[0])
      return res.status(404).json({ error: "Note not found" });
    
    // Security check: is this user's note?
    if (checkResult.rows[0].user_id !== req.session.userId)
      return res.status(403).json({ error: "Unauthorized: Cannot edit other users' notes" });
    
    // Step 4: Update the note
    const result = await db.query(
      "UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING id, user_id, title, content, created_at",
      [title, content, id],
    );
    // UPDATE = change existing row
    // SET = change these columns
    // WHERE id = $3 = only this note
    
    // Step 5: Send updated note back
    res.json({ note: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update note" });
  }
});
```

**Database flow:**
```
User logged in? ✅
Note ID valid? ✅
Title + Content provided? ✅
User owns this note? ✅
     ↓
UPDATE notes SET title = '...', content = '...' WHERE id = 5
     ↓
Database updates row
     ↓
Return updated note
```

**Response (Success - 200):**
```json
{
  "note": {
    "id": 5,
    "user_id": 1,
    "title": "Updated Title",
    "content": "Updated content!",
    "created_at": "2026-05-04T10:30:00Z"
  }
}
```

---

### 4️⃣ DELETE - Remove a Note

**Endpoint:**
```
DELETE /api/notes/:id
```

**Example:**
```
DELETE /api/notes/5
```

**Backend code (Line 226-266):**
```typescript
app.delete("/api/notes/:id", async (req, res) => {
  // Step 1: Check if logged in
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  
  const { id } = req.params;
  
  try {
    // Step 2: Check if note exists and belongs to user
    const checkResult = await db.query(
      "SELECT user_id FROM notes WHERE id = $1",
      [id],
    );
    
    if (!checkResult.rows[0])
      return res.status(404).json({ error: "Note not found" });
    
    // Security check: is this user's note?
    if (checkResult.rows[0].user_id !== req.session.userId)
      return res.status(403).json({ error: "Unauthorized: Cannot delete other users' notes" });
    
    // Step 3: Delete the note
    await db.query("DELETE FROM notes WHERE id = $1", [id]);
    // DELETE = remove the row
    // WHERE id = $1 = only this note
    
    // Step 4: Send success response
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});
```

**Database flow:**
```
User logged in? ✅
Note ID valid? ✅
User owns this note? ✅
     ↓
DELETE FROM notes WHERE id = 5
     ↓
Database removes row
     ↓
Return { ok: true }
```

**Response (Success - 200):**
```json
{
  "ok": true
}
```

---

## Step 3: Frontend Implementation

### Home.tsx Changes

#### New State Variables (Lines 16-22)

```typescript
const [notes, setNotes] = useState<Note[]>([]);
// notes = array of all user's notes
// setNotes = function to update notes

const [loading, setLoading] = useState(true);
// loading = true while fetching notes

const [showForm, setShowForm] = useState(false);
// showForm = true when create/edit form is open

const [editingNote, setEditingNote] = useState<Note | null>(null);
// editingNote = the note being edited (null if creating new)

const [title, setTitle] = useState("");
// title = current form title input

const [content, setContent] = useState("");
// content = current form content input

const [error, setError] = useState("");
// error = error message to show

const [submitting, setSubmitting] = useState(false);
// submitting = true while saving to backend
```

---

#### Fetch Notes on Load (Lines 31-45)

```typescript
useEffect(() => {
  // useEffect with empty [] = run once on page load
  fetchNotes();
}, []);

const fetchNotes = async () => {
  // Make GET request to backend
  try {
    const res = await fetch(`${API}/notes`, { credentials: "include" });
    const data = await res.json();
    
    if (res.ok) {
      setNotes(data.notes);  // Save notes to state
    } else {
      setError(data.error);
    }
  } catch (err) {
    setError("Failed to load notes");
  } finally {
    setLoading(false);  // Done loading
  }
};
```

**Flow:**
```
Page loads
     ↓
useEffect runs (because [] = once)
     ↓
fetchNotes() is called
     ↓
GET /api/notes sent to backend
     ↓
Backend returns notes array
     ↓
setNotes(data.notes) updates state
     ↓
Component re-renders with notes
```

---

#### Handle Create/Edit Form (Lines 57-75)

```typescript
const handleOpenForm = (note: Note | null = null) => {
  // If note provided = editing mode
  if (note) {
    setEditingNote(note);  // Remember which note we're editing
    setTitle(note.title);  // Fill form with note data
    setContent(note.content);
  } else {
    // Creating new note
    setEditingNote(null);
    setTitle("");
    setContent("");
  }
  
  setShowForm(true);  // Show the form modal
  setError("");
};

const handleCloseForm = () => {
  // Close form and clear data
  setShowForm(false);
  setEditingNote(null);
  setTitle("");
  setContent("");
  setError("");
};
```

---

#### Save Note (Create or Update) (Lines 77-108)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();  // Stop page refresh
  setError("");
  setSubmitting(true);  // Show loading state

  try {
    let res;
    
    if (editingNote) {
      // UPDATE MODE
      res = await fetch(`${API}/notes/${editingNote.id}`, {
        method: "PUT",  // PUT = update
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, content }),
      });
    } else {
      // CREATE MODE
      res = await fetch(`${API}/notes`, {
        method: "POST",  // POST = create
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, content }),
      });
    }

    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error);

    fetchNotes();  // Refresh notes list from backend
    handleCloseForm();  // Close form
    
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to save note");
  } finally {
    setSubmitting(false);  // Stop loading
  }
};
```

**Flow:**
```
User clicks "Save Note"
     ↓
Is this edit or create?
  - Edit: PUT /api/notes/5 with new data
  - Create: POST /api/notes with new data
     ↓
Backend saves to database
     ↓
Return updated/created note
     ↓
fetchNotes() gets fresh list
     ↓
Component re-renders with new notes
```

---

#### Delete Note (Lines 110-130)

```typescript
const handleDelete = async (id: number) => {
  // Confirm before deleting
  if (!window.confirm("Are you sure you want to delete this note?")) 
    return;

  try {
    // Send DELETE request
    const res = await fetch(`${API}/notes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }

    // Remove from local state immediately (better UX)
    setNotes(notes.filter((note) => note.id !== id));
    
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to delete note");
  }
};
```

**Flow:**
```
User clicks "Delete"
     ↓
Show confirmation dialog
     ↓
User confirms
     ↓
DELETE /api/notes/5 sent
     ↓
Backend deletes from database
     ↓
Remove from local state (updates UI instantly)
```

---

#### UI Components

**Header with user info and logout:**
```jsx
<div className="flex justify-between items-center mb-8">
  <div className="flex items-center gap-4">
    <!-- Avatar circle with initials -->
    <!-- User name and email -->
  </div>
  <button onClick={handleLogout}>Log out</button>
</div>
```

**Notes title and Create button:**
```jsx
<div className="flex justify-between items-center mb-6">
  <h2 className="text-3xl font-bold text-slate-900">My Notes</h2>
  <button onClick={() => handleOpenForm()}>+ New Note</button>
</div>
```

**Create/Edit Form Modal:**
```jsx
{showForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <!-- Form with title and content inputs -->
    <!-- Save and Cancel buttons -->
  </div>
)}
```

**Notes Grid (Cards):**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {notes.map((note) => (
    <div key={note.id} className="bg-white p-6 rounded-xl">
      <h3>{note.title}</h3>
      <p>{note.content}</p>
      <div className="flex gap-2">
        <button onClick={() => handleOpenForm(note)}>Edit</button>
        <button onClick={() => handleDelete(note.id)}>Delete</button>
      </div>
    </div>
  ))}
</div>
```

---

## Complete CRUD Flow Example

### User Creates a Note

```
1. User clicks "+ New Note" button
   └─> handleOpenForm() runs
   └─> showForm = true (form modal appears)

2. User types title "Shopping List" and content "Milk, eggs, bread"

3. User clicks "Save Note" button
   └─> handleSubmit() runs
   └─> POST /api/notes with { title, content }

4. Backend receives request
   └─> Checks if user logged in ✅
   └─> Validates data ✅
   └─> Inserts into notes table
   └─> Returns { note: { id: 5, ... } }

5. Frontend receives response
   └─> fetchNotes() called
   └─> GET /api/notes

6. Backend returns all notes
   └─> setNotes(data.notes) updates state
   └─> Component re-renders
   └─> New note appears in grid

7. Form closes and clears
```

---

### User Edits a Note

```
1. User clicks "Edit" on a note
   └─> handleOpenForm(note) runs
   └─> Form fills with note's title and content

2. User changes content

3. User clicks "Save Note"
   └─> handleSubmit() runs
   └─> PUT /api/notes/5 with new data

4. Backend receives request
   └─> Checks if user owns note ✅
   └─> Updates database
   └─> Returns updated note

5. Frontend refreshes and re-renders
```

---

### User Deletes a Note

```
1. User clicks "Delete" button
   └─> Confirmation dialog appears

2. User confirms deletion
   └─> DELETE /api/notes/5

3. Backend removes from database
   └─> Returns { ok: true }

4. Frontend removes from state
   └─> setNotes(notes.filter(n => n.id !== 5))
   └─> Card disappears from UI
```

---

## Security Features

### 1. Authentication Check
Every endpoint checks:
```typescript
if (!req.session.userId)
  return res.status(401).json({ error: "Not logged in" });
```

### 2. Authorization Check
UPDATE and DELETE check user owns the note:
```typescript
if (checkResult.rows[0].user_id !== req.session.userId)
  return res.status(403).json({ error: "Unauthorized" });
```

### 3. Data Validation
```typescript
if (!title || !content)
  return res.status(400).json({ error: "Missing fields" });
```

---

## Error Codes Reference

| Code | Meaning | Example |
|------|---------|---------|
| 200 | ✅ Success | Note saved |
| 400 | ❌ Bad request | Missing title |
| 401 | ❌ Not logged in | No session |
| 403 | ❌ Unauthorized | Can't edit other's notes |
| 404 | ❌ Not found | Note ID doesn't exist |
| 500 | ❌ Server error | Database error |

---

## Testing the APIs

### Using Postman

1. **Create Note:**
```
POST http://localhost:3001/api/notes
Headers: Content-Type: application/json
Body: { "title": "Test", "content": "Testing" }
```

2. **Get All Notes:**
```
GET http://localhost:3001/api/notes
```

3. **Update Note:**
```
PUT http://localhost:3001/api/notes/1
Headers: Content-Type: application/json
Body: { "title": "Updated", "content": "New content" }
```

4. **Delete Note:**
```
DELETE http://localhost:3001/api/notes/1
```

---

## Summary

### What CRUD Means:
- **CREATE (POST)** - Add new data
- **READ (GET)** - Retrieve data
- **UPDATE (PUT)** - Modify data
- **DELETE (DELETE)** - Remove data

### Key Concepts:
- Backend = API that handles database
- Frontend = UI that calls API
- Session = Keeps user logged in
- Security = Check user owns data before modifying
- State = Frontend remembers data without reloading

### Database Relations:
```
users (1) ─── (many) notes
Each user can have many notes
Each note belongs to one user
```

That's it! You now have a complete CRUD application! 🎉

# CRUD Architecture Diagram

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Frontend)                             │
│                    http://localhost:5173                                │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  App.tsx - Main Component                                      │   │
│  │  - Manages login/signup state                                 │   │
│  │  - Routes to LoginForm, SignupForm, or Home                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Home.tsx - Notes Management                                  │   │
│  │  - Displays notes grid                                        │   │
│  │  - Create/Edit/Delete notes                                  │   │
│  │  - Manage form modal                                         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  API Calls (fetch)                                            │   │
│  │  - POST   /api/notes         (Create)                        │   │
│  │  - GET    /api/notes         (Read All)                      │   │
│  │  - GET    /api/notes/:id     (Read One)                      │   │
│  │  - PUT    /api/notes/:id     (Update)                        │   │
│  │  - DELETE /api/notes/:id     (Delete)                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  HTTP Requests over Network                                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
         ↑↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────────────────┐
│                       NODE.JS BACKEND                                   │
│                   http://localhost:3001                                 │
│                     server.ts (Express)                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Route Handlers (5 CRUD Endpoints)                             │ │
│  │                                                                │ │
│  │  CREATE: POST /api/notes                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 1. Check if user logged in                            │ │ │
│  │  │ 2. Get title & content from request body              │ │ │
│  │  │ 3. Validate data exists                               │ │ │
│  │  │ 4. INSERT into notes table                            │ │ │
│  │  │ 5. Return created note                                │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  READ: GET /api/notes                                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 1. Check if user logged in                            │ │ │
│  │  │ 2. Query all notes WHERE user_id = logged_in_user    │ │ │
│  │  │ 3. Return array of notes                              │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  READ: GET /api/notes/:id                                    │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 1. Check if user logged in                            │ │ │
│  │  │ 2. Get note ID from URL                               │ │ │
│  │  │ 3. Query WHERE id AND user_id = logged_in_user        │ │ │
│  │  │ 4. Return single note                                 │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  UPDATE: PUT /api/notes/:id                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 1. Check if user logged in                            │ │ │
│  │  │ 2. Check if note exists and user owns it              │ │ │
│  │  │ 3. UPDATE note SET title, content WHERE id            │ │ │
│  │  │ 4. Return updated note                                │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  DELETE: DELETE /api/notes/:id                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 1. Check if user logged in                            │ │ │
│  │  │ 2. Check if note exists and user owns it              │ │ │
│  │  │ 3. DELETE FROM notes WHERE id                         │ │ │
│  │  │ 4. Return { ok: true }                                │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Database Connection (pg Pool)                                 │ │
│  │  - postgresql://postgres:123456@localhost:5432/nezari          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
         ↑↓ SQL Queries
┌─────────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                                │
│                          nezari (Database)                              │
│                                                                         │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐  │
│  │   USERS TABLE            │  │   NOTES TABLE                   │  │
│  ├──────────────────────────┤  ├──────────────────────────────────┤  │
│  │ id (PK)                  │  │ id (PK)                          │  │
│  │ email (UNIQUE)           │  │ user_id (FK -> users.id)         │  │
│  │ password (encrypted)     │  │ title                            │  │
│  │ name                     │  │ content                          │  │
│  │ created_at               │  │ created_at                       │  │
│  └──────────────────────────┘  │ updated_at                       │  │
│           ↑                     └──────────────────────────────────┘  │
│           │                               ↓                            │
│           └──────────── 1 User ─── Many Notes ──────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND STATE (React)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  useEffect() → fetch /api/notes                        │
│       ↓                                                 │
│  Backend returns: [note1, note2, note3]                │
│       ↓                                                 │
│  setNotes([...]) → updates state                       │
│       ↓                                                 │
│  Component re-renders → displays notes in UI           │
│                                                         │
│  User clicks "+ New Note"                             │
│       ↓                                                 │
│  setShowForm(true) → modal appears                     │
│       ↓                                                 │
│  User fills form                                       │
│       ↓                                                 │
│  User clicks "Save"                                    │
│       ↓                                                 │
│  POST /api/notes with {title, content}                │
│       ↓                                                 │
│  Backend creates note in database                      │
│       ↓                                                 │
│  Backend returns new note                              │
│       ↓                                                 │
│  fetchNotes() → GET /api/notes                         │
│       ↓                                                 │
│  setNotes([...new notes]) → updates state              │
│       ↓                                                 │
│  Component re-renders → new note appears!              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Request/Response Cycle

### CREATE REQUEST:
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Home.tsx)                                    │
│  User clicks "Save Note"                               │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  HTTP POST Request to Backend                           │
│  ─────────────────────────────────────────────────────  │
│  URL: http://localhost:3001/api/notes                  │
│  Headers:                                               │
│    Content-Type: application/json                      │
│    Cookie: session_id=abc123                           │
│  Body:                                                  │
│    {                                                   │
│      "title": "My Note",                              │
│      "content": "Note content"                         │
│    }                                                   │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Backend (server.ts)                                    │
│  POST /api/notes handler                               │
│                                                         │
│  1. Extract session → user_id = 1                      │
│  2. Extract body → title, content                      │
│  3. Validate → check not empty                         │
│  4. Query DB → INSERT into notes                       │
│  5. Response → return created note                     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  HTTP Response Back to Frontend                         │
│  ─────────────────────────────────────────────────────  │
│  Status: 200 OK                                         │
│  Headers:                                               │
│    Content-Type: application/json                      │
│  Body:                                                  │
│    {                                                   │
│      "note": {                                         │
│        "id": 5,                                        │
│        "user_id": 1,                                   │
│        "title": "My Note",                            │
│        "content": "Note content",                      │
│        "created_at": "2026-05-04T10:30:00Z"           │
│      }                                                 │
│    }                                                   │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Frontend (Home.tsx)                                    │
│  onSuccess() handler                                    │
│                                                         │
│  1. fetchNotes() → get fresh list                      │
│  2. setNotes([...new notes])                           │
│  3. handleCloseForm() → close modal                    │
│  4. Component re-renders                               │
│                                                         │
│  Result: New note appears in grid! ✅                  │
└─────────────────────────────────────────────────────────┘
```

---

## Security Checks

```
┌─────────────────────────────────────────────────────────┐
│         Frontend Sends Request to Backend               │
└────────────────┬────────────────────────────────────────┘
                 ↓
         ┌──────────────────┐
         │ Security Check 1 │
         │ Is user logged   │
         │ in?              │
         └────────┬─────────┘
                  ↓ NO
           ❌ 401 Error
           "Not logged in"
                  │
                  ↓ YES
         ┌──────────────────┐
         │ Security Check 2 │
         │ Is data valid?   │
         │ (has fields)     │
         └────────┬─────────┘
                  ↓ NO
           ❌ 400 Error
           "Missing fields"
                  │
                  ↓ YES (for Update/Delete only)
         ┌──────────────────┐
         │ Security Check 3 │
         │ Does note exist? │
         │                  │
         └────────┬─────────┘
                  ↓ NO
           ❌ 404 Error
           "Note not found"
                  │
                  ↓ YES (for Update/Delete only)
         ┌──────────────────┐
         │ Security Check 4 │
         │ Does user own    │
         │ the note?        │
         └────────┬─────────┘
                  ↓ NO
           ❌ 403 Error
           "Unauthorized"
                  │
                  ↓ YES
         ┌──────────────────┐
         │ ✅ All Checks    │
         │ Pass!            │
         │ Execute Operation│
         └──────────────────┘
```

---

## Database Schema Relationship

```
USERS Table
┌─────────────────────────────────────┐
│ id  │ email          │ name          │
├─────┼────────────────┼───────────────┤
│ 1   │ john@test.com  │ John Doe      │
│ 2   │ jane@test.com  │ Jane Smith    │
└─────────────────────────────────────┘
  │
  │ (user_id = Foreign Key)
  │
  ├─────────────────────────────────────────────┐
  │                                             │
NOTES Table
┌──────────┬──────────────┬──────────────────┐
│ id │ user_id │ title      │ content        │
├────┼─────────┼────────────┼────────────────┤
│ 1  │ 1       │ Shopping   │ Milk, eggs     │
│ 2  │ 1       │ Homework   │ Math chapter 5 │
│ 3  │ 2       │ Ideas      │ New project... │
│ 4  │ 2       │ Goals      │ Learn React    │
└────┴─────────┴────────────┴────────────────┘

John (user_id=1) can ONLY see notes 1 & 2
Jane (user_id=2) can ONLY see notes 3 & 4
```

---

## Complete Use Case Example

```
User: John (id=1)

1. John signs up with email john@test.com
   → User row created in database

2. John logs in
   → Session created with userId=1

3. John clicks "+ New Note"
   → Form modal opens

4. John enters:
   Title: "Shopping List"
   Content: "Milk, eggs, bread, butter"

5. John clicks "Save Note"
   → POST /api/notes
   → { userId: 1, title: "...", content: "..." }

6. Backend receives:
   → Check userId=1 logged in? ✅
   → Check data valid? ✅
   → INSERT INTO notes VALUES (userId=1, title, content)
   → Database creates note with id=5
   → Return { id: 5, userId: 1, title, content, ... }

7. Frontend receives success
   → Refresh notes list
   → GET /api/notes
   → Database finds all notes where user_id=1
   → Returns [note1, note2, note3, note4, note5]

8. setNotes([...]) updates state
   → Component re-renders
   → New note appears as card in grid!

9. John sees his note on the page ✅

10. John clicks "Edit" on the note
    → Form modal opens with current data
    → John changes title to "Grocery List"
    → John clicks "Save Note"
    → PUT /api/notes/5
    → { title: "Grocery List", content: "..." }

11. Backend receives:
    → Check userId=1 logged in? ✅
    → Check note id=5 exists? ✅
    → Check userId=1 owns note 5? ✅
    → UPDATE notes SET title="Grocery List" WHERE id=5
    → Return updated note

12. Frontend refreshes → John sees updated title ✅

13. John clicks "Delete"
    → Confirmation dialog
    → John confirms
    → DELETE /api/notes/5

14. Backend:
    → Check userId=1 logged in? ✅
    → Check note exists? ✅
    → Check userId=1 owns note? ✅
    → DELETE FROM notes WHERE id=5
    → Return { ok: true }

15. Frontend removes from state
    → Card disappears from grid ✅

Result: Full CRUD cycle complete! 🎉
```

---

## Common Error Scenarios

```
SCENARIO 1: Jane tries to edit John's note
─────────────────────────────────────────
Jane (id=2) tries PUT /api/notes/1 (John's note)
     ↓
Backend checks:
  - Jane logged in? ✅
  - Note exists? ✅
  - Does Jane (id=2) own note (user_id=1)? ❌
     ↓
Return 403 Error: "Unauthorized"
Jane cannot edit John's note! ✅ Secure

SCENARIO 2: User not logged in tries to create note
──────────────────────────────────────────────────
Anonymous user tries POST /api/notes
     ↓
Backend checks:
  - req.session.userId exists? ❌
     ↓
Return 401 Error: "Not logged in"
Only logged-in users can create notes! ✅ Secure

SCENARIO 3: User creates note with empty title
───────────────────────────────────────────────
User tries POST /api/notes with { title: "", content: "..." }
     ↓
Backend checks:
  - title exists? ❌
     ↓
Return 400 Error: "Missing fields"
Invalid data rejected! ✅ Validated
```

---

This architecture ensures:
- ✅ Data persistence (database)
- ✅ Real-time updates (frontend refresh)
- ✅ User isolation (security)
- ✅ Error handling (validation)
- ✅ Clean separation of concerns (frontend/backend)

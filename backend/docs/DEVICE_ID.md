# Device ID — Per-User Data Isolation

## The Problem

Before this change, every query to the database was completely open. A `SELECT * FROM applications` returned every single row regardless of who was asking. If two people visited the live URL at the same time, they would see each other's job applications. There was no concept of ownership — the data was shared across everyone.

---

## The Solution

Instead of building a full authentication system (login, passwords, sessions), we implemented a lightweight device-based identification system. The first time a user visits the app, the browser generates a random UUID and stores it in `localStorage`. That ID is sent with every request as a custom HTTP header called `x-device-id`. The backend reads that header and uses it to filter every database query so each device only ever sees its own rows.

---

## How It Works — Full Chain

1. **Browser generates an ID on first visit**
   ```js
   function getDeviceId() {
     let id = localStorage.getItem('pipeline_device_id');
     if (!id) {
       id = crypto.randomUUID();
       localStorage.setItem('pipeline_device_id', id);
     }
     return id;
   }
   ```
   `crypto.randomUUID()` is built into the browser — no library needed. The ID is saved so the same one is returned on every future visit.

2. **Frontend sends the ID as a header on every request**
   ```js
   fetch(`/api/applications`, {
     headers: { 'x-device-id': getDeviceId() },
   });
   ```
   The `x-` prefix is convention for custom HTTP headers. This is how the backend knows who is making the request.

3. **Backend reads the header**
   ```js
   const getDeviceId = (req) => req.headers["x-device-id"] || "unknown";
   ```
   Every controller function calls this before running any query. If no header is present it falls back to `"unknown"` so the app does not crash.

4. **Database filters by device ID**
   ```js
   pool.query(
     "SELECT * FROM applications WHERE device_id = $1 ORDER BY created_at DESC",
     [deviceId]
   );
   ```
   The `WHERE device_id = $1` clause tells Postgres to only return rows that belong to this device. The `$1` is a parameterized placeholder — the value is passed separately in the array, not embedded in the SQL string. This prevents SQL injection.

5. **New rows are stored with the device ID**
   ```js
   pool.query(
     `INSERT INTO applications (..., device_id) VALUES (..., $7) RETURNING *`,
     [..., deviceId]
   );
   ```
   Every application created is tagged with the device ID at insert time, so future queries can filter by it correctly.

---

## What Changed in the Database

A `device_id` column was added to the `applications` table in Supabase:

```sql
ALTER TABLE applications ADD COLUMN device_id TEXT;
```

This column stores the UUID for each row. Existing rows have a `NULL` device_id and will not appear for any user — they are effectively orphaned unless manually updated.

---

## Tradeoffs

| Benefit | Limitation |
|---|---|
| No login required | Clearing localStorage loses all data |
| Zero friction for the user | Does not work across multiple devices |
| Simple to implement | No password protection |
| Private per device | A determined user could spoof another device's ID |

For a portfolio job tracker with no sensitive financial or personal data, this tradeoff is acceptable. Real authentication (JWT, sessions, OAuth) is the Phase 2 upgrade when user accounts become a requirement.

---

## Files Changed

| File | What Changed |
|---|---|
| `frontend/src/api/applications.js` | Added `getDeviceId()`, sends `x-device-id` header on all fetch calls |
| `backend/src/controllers/applications.controller.js` | Added `getDeviceId(req)`, updated all four queries to filter or tag by device_id |
| Supabase SQL Editor | Ran `ALTER TABLE applications ADD COLUMN device_id TEXT` |

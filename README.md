# LensLab Studio — Camera Rental Backend (PD-CSEDS2A-G05)

A modular Node.js, Express, and SQLite REST API backend designed for LensLab Studio to eliminate equipment rental conflicts and prevent double-booking when multiple photographers request the same camera on the same day.

---

## Modular Project Structure

```
BDF_project/
├── app.js                              # Express app setup, routing & global error handling
├── database/
│   └── db.js                           # SQLite database connection, PRAGMA foreign keys & table creation
├── middleware/
│   └── validate.js                     # Request validation & camera kind Twist rules
├── routes/
│   ├── cameras.js                      # Camera CRUD & ?kind= query search
│   ├── photographers.js                # Photographer endpoints
│   └── rentals.js                      # Rental creation & SQL JOIN endpoints
├── test.js                             # Comprehensive automated test runner
├── LensLab_Studio.postman_collection.json # Postman v2.1 test collection
├── package.json                        # Dependencies (express, sqlite, sqlite3, nodemon)
└── README.md                           # Documentation & setup instructions
```

---

## Database Schema (3 Relational Tables)

SQLite database: `lenslab.db` with `PRAGMA foreign_keys = ON;`

### 1. `photographers`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `phone` TEXT

### 2. `cameras`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `kind` TEXT NOT NULL

### 3. `rentals`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `photographer_id` INTEGER NOT NULL, FOREIGN KEY REFERENCES `photographers(id)` ON DELETE CASCADE
- `camera_id` INTEGER NOT NULL, FOREIGN KEY REFERENCES `cameras(id)` ON DELETE CASCADE
- `rental_date` TEXT NOT NULL
- `UNIQUE(camera_id, rental_date)` constraint enforcing zero same-day double bookings.

---

## REST Endpoints & Status Codes

### Photographers (`/photographers`)
- `GET /photographers` — Return all photographers (`200 OK`).
- `GET /photographers/:id` — Return single photographer (`200 OK`), or `404 Not Found`.
- `POST /photographers` — Add photographer (`name`, `phone`). Returns `201 Created`, or `400 Bad Request` if name is missing.

### Cameras (`/cameras`)
- `GET /cameras` — Return all cameras (`200 OK`). Supports filtering by query: `GET /cameras?kind=<value>`.
- `GET /cameras/:id` — Return one camera (`200 OK`), or `404 Not Found`.
- `POST /cameras` — Add a camera (`name`, `kind`). Returns `201 Created`.
- `PUT /cameras/:id` — Update a camera (`name`, `kind`). Returns `200 OK`, or `404 Not Found`.
- `DELETE /cameras/:id` — Delete a camera (`200 OK`), or `404 Not Found`.

### Rentals (`/rentals`)
- `GET /rentals` — **SQL JOIN endpoint**: Returns rentals joined with `photographer_name` and `camera_name` (`200 OK`).
- `POST /rentals` — Create a rental booking (`photographer_id`, `camera_id`, `rental_date`).
  - Returns `404 Not Found` if `photographer_id` or `camera_id` does not exist.
  - Returns `409 Conflict` if the camera is already booked on `rental_date`.
  - Returns `201 Created` on successful reservation.

---

## Twist Rule & Test Verification

A camera's kind must strictly be one of:
- `DSLR`
- `Mirrorless`
- `Action`

Any other value returns `400 Bad Request` with a JSON payload listing all allowed values.

| Test Case | Request | Response |
|---|---|---|
| **Test 1** | `POST /cameras` with `kind: "DSLR"` | `201 Created` |
| **Test 2** | `POST /cameras` with `kind: "Other"` | `400 Bad Request` (Allowed values: DSLR, Mirrorless, Action) |
| **Test 3** | `PUT /cameras/:id` with `kind: "Mirrorless"` | `200 OK` |

---

## Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Server
```bash
npm start
```
Server runs at `http://localhost:3000`.

For auto-reloading development:
```bash
npm run dev
```

### 3. Run Automated Verification Tests
```bash
npm test
```

---

## Postman Collection

Import `LensLab_Studio.postman_collection.json` into Postman to execute pre-configured test requests for all endpoints, error conditions, and Twist verification scenarios.

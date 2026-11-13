# LensLab Studio — Camera Rental Management System

**Theme:** 5 of 30 · Camera Rental  
**Group:** PD-CSEDS2A-G05 (Group 5)  
**Card:** 185 of 375  

---

## Overview

LensLab Studio operates an equipment rental desk. Previously, rentals were coordinated via phone calls, leading to scheduling conflicts where multiple photographers arrived for the same camera on the same date. 

This project provides a robust REST API and SQLite database system that strictly prevents double-booking while managing photographers, cameras, and rental schedules.

---

## Team Roles & Responsibilities

| Part | Role | Responsibilities |
|---|---|---|
| **1** | Server & Routes | Express server setup, middleware configuration, standard HTTP status codes |
| **2** | Database | SQLite schema design, 3 relational tables, foreign key constraints, unique indexing |
| **3** | REST Endpoints | Full CRUD for cameras, photographers, rentals, and multi-table join endpoint |
| **4** | Validation & Search | Request body validation, query parameter search (`?kind=`, `?search=`), error handling |
| **5** | Twist Rule | Strict camera kind validation (`DSLR`, `Mirrorless`, `Action`), handling tests 1–3 |
| **6** | Postman & README | Postman test collection export, setup guide, and API documentation |

---

## Database Schema

Database: SQLite (`lenslab.db`) with `PRAGMA foreign_keys = ON;`

### 1. `photographers`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `phone` TEXT

### 2. `cameras`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `kind` TEXT NOT NULL CHECK(kind IN ('DSLR', 'Mirrorless', 'Action'))

### 3. `rentals`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `photographer_id` INTEGER NOT NULL (FK -> `photographers.id` ON DELETE CASCADE)
- `camera_id` INTEGER NOT NULL (FK -> `cameras.id` ON DELETE CASCADE)
- `rental_date` TEXT NOT NULL
- **Constraint:** `UNIQUE(camera_id, rental_date)` prevents duplicate booking of any camera on the same date.

---

## Twist Rule & Test Verification

**Rule:** Camera `kind` must be strictly one of `DSLR`, `Mirrorless`, or `Action`. Any other value returns status `400` with the list of allowed values.

- **Test 1:** `POST /cameras` with `kind: "DSLR"` → Returns **201 Created**
- **Test 2:** `POST /cameras` with `kind: "Other"` → Returns **400 Bad Request** (`Allowed values: DSLR, Mirrorless, Action`)
- **Test 3:** `PUT /cameras/:id` with `kind: "Mirrorless"` → Returns **200 OK**

---

## API Endpoints

### Cameras
- `GET /cameras` — List all cameras
- `GET /cameras?kind=Mirrorless` — Filter cameras by kind
- `GET /cameras?search=Canon` — Search cameras by name or kind
- `GET /cameras/:id` — Retrieve a single camera
- `POST /cameras` — Add a new camera (`{ "name": "...", "kind": "..." }`)
- `PUT /cameras/:id` — Update camera details
- `DELETE /cameras/:id` — Delete a camera

### Photographers
- `GET /photographers` — List all photographers
- `GET /photographers/:id` — Retrieve a single photographer
- `POST /photographers` — Register a photographer (`{ "name": "...", "email": "...", "phone": "..." }`)
- `PUT /photographers/:id` — Update photographer details
- `DELETE /photographers/:id` — Delete a photographer

### Rentals
- `GET /rentals` — List all rental records
- `GET /rentals/details` — **Join endpoint:** Rentals joined with photographer name, email, camera name, and camera kind
- `GET /rentals/:id` — Retrieve a single rental record
- `POST /rentals` — Create a rental booking (`{ "photographer_id": 1, "camera_id": 1, "rental_date": "YYYY-MM-DD" }`)
  - Returns `409 Conflict` if the camera is already booked on that date
- `PUT /rentals/:id` — Update rental details
- `DELETE /rentals/:id` — Cancel / delete a rental booking

---

## Setup & Running

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Run Server
```bash
npm start
```
Server runs on `http://localhost:3000`.

### Run Automated Tests
```bash
npm test
```

---

## Postman Collection

Import `postman_collection.json` into Postman to run pre-configured requests covering all CRUD actions, validation tests, query searches, and join queries.

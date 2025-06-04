# 📦 Altar Backend API

This backend service provides real-time and RESTful APIs for the Altar.io Full-Stack Exercise, including grid/code logic and payment storage.

## ⚡ Features

- Real-time grid and code updates via Firebase.
- RESTful API for grid, code, and payment operations.
- Supports grid biasing for testing.
- Simple, stateless backend for easy integration.
- Example requests included for quick start.

## 📡 Firebase Real-Time Updates

Listen to the `updates/current` document in Firestore to receive the latest grid and code. Payment events are stored in the `payments` collection.

Example Firestore structure:
```json
updates/current: { grid: [...], code: "42", timestamp: "..." }
payments/{id}: { name, amount, code, grid, timestamp }
```

---

## 🟩 Grid Logic

- The backend generates a **10x10 grid** of random lowercase letters (`a-z`).
- If the client provides a **bias** character via query parameter (`?bias=z`), 20% of grid cells will use that character, randomly distributed.
- The latest grid and code are pushed to Firebase whenever generated.

---

## 🔢 Code Logic

- For every new grid, a 2-digit code is generated as follows:
  1. Find the characters at positions `[3][6]` and `[6][3]` in the grid.
  2. Count how many times each character appears in the grid.
  3. If a count is greater than 9, repeatedly divide it by 2 (rounding down) until it's ≤ 9.
  4. Concatenate the two single-digit counts to form the code (e.g., `75`).

---

## 🚀 API Endpoints

| Method | Endpoint         | Description                                              |
|--------|------------------|----------------------------------------------------------|
| GET    | `/api/grid`      | Returns a new 10x10 grid. Supports `?bias=a-z` query.    |
| POST   | `/api/code`      | Accepts a grid in body, returns computed 2-digit code.   |
| GET    | `/api/payments`  | Returns all payment entries.                             |
| POST   | `/api/payments`  | Stores a payment with `name`, `amount`, `code`, `grid`.  |
| GET    | `/`              | Returns a simple server status message.                  |

### Example: `POST /api/code`

Request body:
```json
{
  "grid": [
    ["a", "b", ...],
    ...
  ]
}

## 🛠 Deploying on Vercel

This repository now includes a `vercel.json` configuration and serverless functions in the `api/` directory. After installing the [Vercel CLI](https://vercel.com/docs/cli), run:

```bash
vercel --prod
```

This will build the TypeScript functions and deploy them to Vercel.

GitHub Actions workflows have been removed. Deploy using `vercel --prod` when ready.

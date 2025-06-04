# 📦 Altar Backend API

This backend service provides real-time and RESTful APIs for the Altar.io Full-Stack Exercise, including grid/code logic and payment storage.

## ⚡ Features

- Real-time grid and code updates via WebSocket.
- RESTful API for grid, code, and payment operations.
- Supports grid biasing for testing.
- Simple, stateless backend for easy integration.
- Example requests included for quick start.

## 📡 WebSocket Connection

- **Endpoint:** Connect to `ws://<your-server-host>:<port>` (e.g., `ws://localhost:3000`)
- **Events:**
  - On connection, you receive:
    ```json
    {
      "type": "initial_state",
      "grid": [ ... ],
      "code": "42"
    }
    ```
  - Every 2 seconds, a broadcast message is sent to **all clients**:
    ```json
    {
      "type": "update",
      "grid": [ ... ],
      "code": "57"
    }
    ```
- **Notes:**  
  The grid and code auto-update every 2 seconds. Use the broadcast data to update your frontend in real time.

---

## 🟩 Grid Logic

- The backend generates a **10x10 grid** of random lowercase letters (`a-z`).
- If the client provides a **bias** character via query parameter (`?bias=z`), 20% of grid cells will use that character, randomly distributed.
- The grid is refreshed automatically every 2 seconds and sent via WebSocket.

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

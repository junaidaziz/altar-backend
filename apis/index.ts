import "dotenv/config";
import express from "express";
import http from "http"; // Keep http for server creation, but not for WSS
import cors from "cors";

import gridRouter from "./grid";
import codeRouter from "./code";
import paymentsRouter from "./payments";
import { generateGrid } from "./grid";
import { computeCode } from "./code";
import { pushGridUpdate, fetchCurrentGrid, fetchPayments } from "./firebase";

const app = express();

app.use(cors());
app.use(express.json());

// SSE clients for real-time updates
const paymentClients: express.Response[] = [];
const gridClients: express.Response[] = [];

// Ensure a grid exists on startup
(async () => {
  try {
    const stored = await fetchCurrentGrid();
    if (!stored) {
      const grid = generateGrid();
      const code = computeCode(grid, new Date());
      await pushGridUpdate(grid, code);
    }
  } catch (err) {
    console.error("Firebase initial grid failed", err);
  }
})();

// Server-Sent Events endpoint for real-time payment updates
app.get("/api/payments/stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.flushHeaders();

  paymentClients.push(res);

  req.on("close", () => {
    const idx = paymentClients.indexOf(res);
    if (idx !== -1) {
      paymentClients.splice(idx, 1);
    }
  });
});

app.get("/api/grid/stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.flushHeaders();

  gridClients.push(res);

  req.on("close", () => {
    const idx = gridClients.indexOf(res);
    if (idx !== -1) {
      gridClients.splice(idx, 1);
    }
  });
});

async function broadcastPayments() {
  try {
    const items = await fetchPayments();
    const data = `data: ${JSON.stringify(items)}\n\n`;
    paymentClients.forEach(client => client.write(data));
  } catch (err) {
    console.error("Failed to broadcast payments", err);
  }
}

async function broadcastGrid() {
  try {
    const stored = await fetchCurrentGrid();
    if (stored) {
      const data = `data: ${JSON.stringify(stored)}\n\n`;
      gridClients.forEach(client => client.write(data));
    }
  } catch (err) {
    console.error("Failed to broadcast grid", err);
  }
}

setInterval(() => {
  broadcastPayments();
  broadcastGrid();
}, 2000);

// Periodically broadcast current state to connected clients

app.get("/", (req, res) => {
  res.send("Hello from TypeScript Express Server!");
});

app.use("/api/grid", gridRouter);
app.use("/api/code", codeRouter);
app.use("/api/payments", paymentsRouter(broadcastPayments));

// Export the Express app for Vercel
// Vercel will create a serverless function from this exported app.
export default app;

// For local development, you can still run the server directly:
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(
      `Local Development Server is running on http://localhost:${port}`
    );
    console.log(`Grid API available at http://localhost:${port}/api/grid`);
    console.log(`Code API available at http://localhost:${port}/api/code`);
    console.log(
      `Payments API available at http://localhost:${port}/api/payments`
    );
  });
}

import "dotenv/config";
import express from "express";
import http from "http"; // Keep http for server creation, but not for WSS
import cors from "cors";

import gridRouter from "./grid";
import codeRouter from "./code";
import paymentsRouter from "./payments";
import { generateGrid } from "./grid";
import { computeCode } from "./code";
import { pushGridUpdate, fetchCurrentGrid } from "./firebase";

const app = express();

app.use(cors());
app.use(express.json());

// In-memory state (will reset with each serverless function invocation)
let currentGrid: string[][] = [];
let currentCode: string = "00";

// SSE clients for real-time payment updates
const paymentClients: express.Response[] = [];

// Initialize grid and code on startup using Firebase persistence if available
(async () => {
  try {
    const stored = await fetchCurrentGrid();
    if (stored) {
      currentGrid = stored.grid;
      currentCode = stored.code;
    } else {
      currentGrid = generateGrid();
      currentCode = computeCode(currentGrid, new Date());
      await pushGridUpdate(currentGrid, currentCode);
    }
  } catch (err) {
    console.error("Firebase initial grid failed", err);
    // fallback generation
    currentGrid = generateGrid();
    currentCode = computeCode(currentGrid, new Date());
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

function broadcastPayment(payment: any) {
  const data = `data: ${JSON.stringify(payment)}\n\n`;
  paymentClients.forEach(client => client.write(data));
}

// The setInterval for grid/code updates is also removed as serverless functions
// don't run continuously. The grid and code will be generated on each request.
// If you need periodic updates, you'd use Vercel Cron Jobs to trigger an endpoint.

app.get("/", (req, res) => {
  res.send("Hello from TypeScript Express Server!");
});

app.use("/api/grid", gridRouter);
app.use("/api/code", codeRouter);
app.use("/api/payments", paymentsRouter(broadcastPayment));

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

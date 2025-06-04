import "dotenv/config";
import express from "express";
import http from "http"; // Keep http for server creation, but not for WSS
import cors from "cors";

import gridRouter from "./grid";
import codeRouter from "./code";
import paymentsRouter from "./payments";
import { generateGrid } from "./grid";
import { computeCode } from "./code";
import { pushPayment, pushGridUpdate } from "./firebase";

const app = express();

app.use(cors());
app.use(express.json());

// In-memory state (will reset with each serverless function invocation)
let currentGrid: string[][] = [];
let currentCode: string = "00";

// Initialize grid and code on startup
currentGrid = generateGrid();
currentCode = computeCode(currentGrid, new Date());
pushGridUpdate(currentGrid, currentCode).catch(err =>
  console.error("Firebase initial grid failed", err)
);

// Note: WebSockets are not directly supported in Vercel's serverless environment.
// For real-time updates on Vercel, consider alternatives like Server-Sent Events (SSE)
// or a dedicated real-time service (e.g., Pusher, Ably).
// The broadcastPayment function is kept for conceptual completeness but won't
// actively broadcast over WebSockets in a Vercel serverless deployment.
function broadcastPayment(payment: any) {
  pushPayment(payment).catch(err =>
    console.error("Firebase payment broadcast failed", err)
  );
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

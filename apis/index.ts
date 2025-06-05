import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";

import gridRouter, { generateGrid } from "./grid";
import codeRouter from "./code";
import paymentsRouter from "./payments";
import { computeCode } from "./code";
import { pushGridUpdate, fetchPayments } from "./firebase";

const app = express();

app.use(cors());
app.use(express.json());

const paymentClients: express.Response[] = [];
const gridClients: express.Response[] = [];

// SSE endpoint for payment updates
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
    if (idx !== -1) paymentClients.splice(idx, 1);
  });
});

// SSE endpoint for grid updates
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
    if (idx !== -1) gridClients.splice(idx, 1);
  });
});

/**
 * Every 2 seconds:
 * 1) Generate a brand-new grid (respecting persistedBiasChar).
 * 2) Compute its code.
 * 3) Push it into Firestore (so it becomes “current”).
 * 4) Immediately send that new { grid, code } out to every SSE subscriber.
 */
setInterval(async () => {
  try {
    const newGrid = generateGrid();
    const newCode = computeCode(newGrid, new Date());
    await pushGridUpdate(newGrid, newCode);

    const payload = { type: "update", grid: newGrid, code: newCode };
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    gridClients.forEach(client => client.write(data));
  } catch (err) {
    console.error("Failed to generate or broadcast new grid:", err);
  }

  try {
    const items = await fetchPayments();
    if (items.length) {
      const last = items[items.length - 1];
      const paymentPayload = { type: "new_payment", payment: last };
      const payData = `data: ${JSON.stringify(paymentPayload)}\n\n`;
      paymentClients.forEach(client => client.write(payData));
    }
  } catch (err) {
    console.error("Failed to broadcast payments", err);
  }
}, 2000);

app.get("/", (_req, res) => {
  res.send("Hello from TypeScript Express Server!");
});

app.use("/api/grid", gridRouter);
app.use("/api/code", codeRouter);
app.use(
  "/api/payments",
  paymentsRouter(() => {
    /* no-op here since our interval already pushes new payments */
  })
);

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Grid API available at http://localhost:${port}/api/grid`);
    console.log(
      `Payments API available at http://localhost:${port}/api/payments`
    );
  });
}

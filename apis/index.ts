// backend/apis/index.ts

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import gridRouter, { generateGrid } from "./grid";
import codeRouter, { computeCode } from "./code";
import paymentsRouter from "./payments";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

let currentGrid: string[][] = [];
let currentCode: string = "00";

function broadcast(data: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", ws => {
  console.log("Client connected via WebSocket");

  ws.send(
    JSON.stringify({
      type: "initial_state",
      grid: currentGrid,
      code: currentCode
    })
  );

  ws.on("message", message => {
    console.log(`Received message from client: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });

  ws.on("error", error => {
    console.error("WebSocket error:", error);
  });
});

// Broadcast updated grid and code every 2 seconds
setInterval(() => {
  currentGrid = generateGrid();
  currentCode = computeCode(currentGrid);
  broadcast({ type: "update", grid: currentGrid, code: currentCode });
  console.log("Grid and Code updated and broadcasted.");
}, 2000);

app.get("/", (req, res) => {
  res.send("Hello from TypeScript Express Server!");
});

app.use("/api/grid", gridRouter);
app.use("/api/code", codeRouter);
app.use("/api/payments", paymentsRouter);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// backend/apis/index.ts

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import cors from "cors";

import gridRouter from "./grid";
import codeRouter from "./code";
import paymentsRouter from "./payments";
import { generateGrid } from "./grid";
import { computeCode } from "./code";

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

function broadcastPayment(payment: any) {
  broadcast({ type: "new_payment", payment: payment });
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

// Update interval to 2 seconds as per PDF requirement
setInterval(() => {
  currentGrid = generateGrid();
  // Use the current time so computeCode can derive grid positions from seconds
  currentCode = computeCode(currentGrid, new Date());
  broadcast({ type: "update", grid: currentGrid, code: currentCode });
  console.log("Grid and Code updated and broadcasted.");
}, 2000); // Changed to 2000 milliseconds (2 seconds)

app.get("/", (req, res) => {
  res.send("Hello from TypeScript Express Server!");
});

app.use("/api/grid", gridRouter);
app.use("/api/code", codeRouter);

app.use("/api/payments", paymentsRouter(broadcastPayment));

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Grid API available at http://localhost:${port}/api/grid`);
  console.log(`Code API available at http://localhost:${port}/api/code`);
  console.log(
    `Payments API available at http://localhost:${port}/api/payments`
  );
  console.log("WebSocket server is running.");
});

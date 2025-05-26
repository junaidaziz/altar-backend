import express from "express";
import http from "http";
import gridRouter from "./grid";
import codeRouter from "./code";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from TypeScript Express Server!");
});

app.use("/api/grid", gridRouter);
app.use("/api/code", codeRouter);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

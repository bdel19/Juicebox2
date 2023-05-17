const PORT = 3000;
const express = require("express");
const server = express();
const { client } = require("./db");

client.connect();

server.listen(PORT, () => {
  console.log("The server is up on port", PORT);
});

const morgan = require("morgan");
server.use(morgan("dev"));

const apiRouter = require("./api");
server.use("/api", apiRouter);

server.use(express.json());

server.use((req, res, next) => {
  console.log("<=====Body Logger Start=====>");
  console.log(req.body);
  console.log("<=====Body Logger End=====>");
  next();
});

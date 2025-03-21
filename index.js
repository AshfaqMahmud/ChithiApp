const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app); // http server
const io = new Server(server, {
  connectionStateRecovery: {}
}); // socket.io with http server

app.get("/hello", (req, res) => {
  // sending from server
  // shown in the client
  res.send("<h1>Hello World</h1>");
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// For each tab opened in the browser, a new client will be added
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// upon receiving a message
io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

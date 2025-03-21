const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

// synchronize the state of the client using sqlite3
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function main() {
  // open the database file
  const db = await open({
    filename: "chat.db",
    driver: sqlite3.Database,
  });

  // create 'msg' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      context TEXT
    );`);

  const app = express();
  const server = createServer(app); // http server
  const io = new Server(server, {
    connectionStateRecovery: {},
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
    socket.on("chat message", async (msg) => {
      let result;
      try {
        // store the msg int the database
        result = await db.run("INSERT INTO messages (content) VALUES (?)", msg);
      } catch (e) {
        // TODO handle the failure
        return;
      }
      // include the offset with the msg
      io.emit("chat message", msg, result.lastID);

      if(!socket.recovered) {
        // if the connection state recovery was not successful

        try{
          await db.each('SELECT id, content FROM messages WHERE id > ?',
            [socket.handshake.auth.serverOffset || 0],
            (_err, row) => {
              socket.emit('chat message', row.content, row.id);
            }
          )
        } catch (e) {
          console.log('Something wrong: ',e);
        }
      }

      console.log("message: " + msg);
      io.emit("chat message", msg);
    });
  });

  server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
  });
}

main();

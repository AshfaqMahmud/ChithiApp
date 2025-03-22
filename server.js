// socket.io integration

const express = require("express");
const http = require("http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/group");
const Message = require("./models/Message");
const path = require("path");

// track connected users : {socketId: userId}
const connectedUsers = new Map();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// middleware
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/auth", authRoutes);
app.use("/group", groupRoutes);

// connect to mongodb
mongoose.connect("mongodb://localhost:27017/chithiapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// socket io connection handler
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // listen for user registration (when a use logs in)
  socket.on("register user", (userData) => {
    const { userId, username } = userData;
    console.log("User registered:", userId, " ", username); // Debugging: Log the registered user

    connectedUsers.set(socket.id, { userId, username }); // mapping socket id to user id
    
    // get the usernames
    // const usernames = Array.from(connectedUsers.values()).map(
    //   (user) => user.username
    // );

    // get the users
    const users = Array.from(connectedUsers.values()); // Get all connected users
    io.emit("update user list", users);
    //io.emit("update user list", usernames); // Send updated user list to all clients
  });

  // Listen for personal message
  socket.on("personal message", async (data) => {
    const { senderId, senderUsername, receiverId, content } = data;
    console.log('Sender ID:', senderId); // Debugging
    console.log('Receiver ID:', receiverId); // Debugging

    // Validate senderId and receiverId as ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      console.error("Invalid senderId or receiverId");
      return;
    }

    console.log("Received personal message:", data); // Debugging

    // Save the message to the database
    const message = new Message({
      sender: senderId,
      senderUsername, // Save sender's username
      receiver: receiverId,
      content,
    });
    await message.save();

    // Find the receiver's socket ID
    const receiverSocketId = Array.from(connectedUsers.entries()).find(
      ([_, user]) => user.userId === receiverId
    )?.[0];

    if (receiverSocketId) {
      // Send the message to the receiver
      //io.to(receiverSocketId).emit("personal message", message);
      io.to(receiverSocketId).emit("personal message", {
        sender: senderId,
        senderUsername, // Include sender's username
        receiver: receiverId,
        content,
      });
    } else {
      console.error("Receiver not found:", receiverId); // Debugging
    }
  });

  // listen for group message
  socket.on("group message", async (data) => {
    const { senderId, groupId, content } = data;
    const message = new Message({ sender: senderId, group: groupId, content });
    await message.save();
    io.to(groupId).emit("group message", message);
  });

  // handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected: ", socket.id);
    connectedUsers.delete(socket.id);
    // const usernames = Array.from(connectedUsers.values()).map(
    //   (user) => user.username
    // );
    // io.emit("update user list", usernames); // Send updated user list to all clients
    
    const users = Array.from(connectedUsers.values()); // Get all connected users
    io.emit("update user list", users);
    // the above line will send the updated user list to all clients
  });
});

// start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

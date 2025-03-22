// socket.io integration

const express = require("express");
const http = require("http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/group");
const Message = require("./models/Message");
const path = require('path');

// track connected users : {socketId: userId}
const connectedUsers = new Map();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// middleware
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

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
  socket.on('register user', (userId)=>{

    console.log('User registered:', userId); // Debugging: Log the registered user

    connectedUsers.set(socket.id, userId);   // mapping socket id to user id
    
    // send updated user list to all clients
    io.emit('update user list', Array.from(connectedUsers.values()));
  });

  // Listen for personal message
  socket.on("personal message", async (data) => {
    const { senderId, receiverId, content } = data;
    // Validate senderId and receiverId as ObjectId
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
        console.error('Invalid senderId or receiverId');
        return;
    }

    const message = new Message({ 
        sender: senderId, 
        receiver: receiverId, 
        content 
    });
    await message.save();

    // find the receiver's socket id
    const receiverSiD = Array.from(connectedUsers.entries()).find(
      ([_, userId]) => userId === receiverId
    )?.[0];
    
    if(receiverSiD) {
      // send the msg to receiver
      io.to(receiverSiD).emit("personal message", message);
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


    io.emit('update user list', Array.from(connectedUsers.values()));
    // the above line will send the updated user list to all clients
  });
});

// start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

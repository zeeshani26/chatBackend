const express = require("express");
require("dotenv").config();
const socketio = require("socket.io");
const http = require("http");
const PORT = process.env.port || 5000;
const { router } = require("./router");
const { addUser, removeUser, getUsersInRoom, getUser } = require("./users");
const cors = require("cors");
//Basic rundown to make server.io working
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);
app.use(router);

// Managing one specific socket in callback function
io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    console.log(name, room);
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);

    socket.emit("message", {
      user: "jarvis",
      text: `${user.name},Welcome to the room ${user.room}`,
    });
    socket.broadcast.to(user.room).emit("message", {
      user: "jarvis",
      text: `${user.name} has joined the room`,
    });
    socket.join(user.room);
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    if (typeof callback === "function") callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "jarvis",
        text: `${user.name} has left the room.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));

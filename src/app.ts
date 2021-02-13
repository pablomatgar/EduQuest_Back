import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
//We are going to store all the users in an array (for now)
const users = {};

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

//We susbscribe to a "connection event"
io.on("connection", (socket) => {
  //If that user doesnt exist
  if (!users[socket.id]) {
    //We create the socket id
    users[socket.id] = socket.id;
  }

  //We emit the id of the user
  socket.emit("yourID", socket.id);
  //We emit the event "allUsers"
  io.sockets.emit("allUsers", users);
  //We suscribe to the "disconnect" event
  socket.on("disconnect", () => {
    //If happens, then we are going to delete de user
    delete users[socket.id];
  });

  //We suscribe to "callUser"
  socket.on("callUser", (data) => {
    console.log("Están llamando - Back-");
    io.to(data.userToCall).emit("hey", {
      //We emmit to the user to call the event "hey"
      signal: data.signalData,
      from: data.from,
    });
  });

  //We suscribe to "Notification" of a  new quest
  //In the client, the socket that is listening should update the state of the quest of every user by reading again from the database the quest.
  socket.on("notification_NewQuest", (data) => {
    console.log("A quest has been send!");
    socket.emit("new_quest", {
      name: data.questName,
      description: data.questDescription,
    });
  });

  //We suscribe to "Notification" of a  new quest
  socket.on("notification_questCompleted", (data) => {
    console.log("A quest has been completed");
    io.to(data.userToCall).emit("quest_completed", {
      name: data.questName,
      description: data.questDescription,
    });
  });

  //We suscribe to "acceptCall"
  socket.on("acceptCall", (data) => {
    console.log("Se aceptó la llamada");
    //We  send to the user the event "callAccepted"
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

const port = process.env.PORT || 8000;

server.listen(port, () => console.log("server is running on port 8000"));

module.exports = app;

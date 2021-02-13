import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import * as firebase from "firebase-admin";
import questsRouter from "./routes/quests";

const serviceAccount = require("../treehacks-b13b9-firebase-adminsdk-gyipb-3d377bee26.json");

const app = express();
const allowlist = (process.env.CLIENT_ALLOWLIST as string).split(",");

firebase.initializeApp({
  //Credenciales que se deben establecer en los procesos que requieran el uso de Firebase
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://treehacks-b13b9.firebaseio.com/",
});

const originCallback = (origin, callback) => {
  if (allowlist.indexOf(origin) !== -1 || !origin) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS!`));
  }
};

const corsOptions = {
  origin: originCallback,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use("/api", questsRouter);

const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server, {
  cors: {
    origin: originCallback,
    credentials: true,
  },
});
//We are going to store all the users in an array (for now)
const users = {};

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
  socket.on("createNotification", (data) => {
    console.log("A quest has been send!");
    socket.emit("new_quest", data);
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

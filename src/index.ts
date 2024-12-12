import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  socket.on("error", console.error);

  socket.on("message", (data) => {
    console.log("received: %s", data);
    socket.send("Data --> " + data);
  });
});

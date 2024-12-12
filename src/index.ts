import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const subscriptions: {
  [key: string]: {
    ws: WebSocket;
    rooms: string[];
  };
} = {};

wss.on("connection", (socket) => {
  const id = randomID();
  subscriptions[id] = {
    ws: socket,
    rooms: [],
  };

  socket.on("message", (data) => {
    //@ts-ignore
    const parsedMessage = JSON.parse(data);
    if (parsedMessage.type === "SUBSCRIBE") {
      subscriptions[id].rooms.push(parsedMessage.room);
    } 

    if (parsedMessage.type === "sendMessage") {
      const message = parsedMessage.message;
      const roomId = parsedMessage.roomId;

      for (const userId in subscriptions) {
        if (subscriptions.hasOwnProperty(userId)) {
          const { ws, rooms } = subscriptions[userId];
          if (rooms.includes(roomId)) {
            ws.send(message);
          }
        }
      }
    }
  });
});

const randomID = () => {
  return Math.random();
};

import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "redis";

const publishClient = createClient();
publishClient.connect();

const subscribeClient = createClient();
subscribeClient.connect();

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
      if (oneUserSubscribedTo(parsedMessage.room)) {
        subscribeClient.subscribe(parsedMessage.room, (message) => {
          const parsedMessage = JSON.parse(message);
          const roomId = parsedMessage.roomId;

          for (const userId in subscriptions) {
            if (subscriptions.hasOwnProperty(userId)) {
              const { ws, rooms } = subscriptions[userId];
              if (rooms.includes(parsedMessage.roomId)) {
                ws.send(parsedMessage.message);
              }
            }
          }
        });
      }
    }

    if (parsedMessage.type === "UNSUBSCRIBE") {
      subscriptions[id].rooms = subscriptions[id].rooms.filter(
        (x) => x !== parsedMessage.room
      );
      if (lastPersonLeftRoom(parsedMessage.room)) {
        subscribeClient.unsubscribe(parsedMessage.room);
      }
    }

    if (parsedMessage.type === "sendMessage") {
      const message = parsedMessage.message;
      const roomId = parsedMessage.roomId;

      publishClient.publish(
        roomId,
        JSON.stringify({
          type: "sendMessage",
          roomId: roomId,
          message,
        })
      );
    }
  });
});

const oneUserSubscribedTo = (roomId: string) => {
  let totalInterestedPeople = 0;
  for (const userId in subscriptions) {
    if (subscriptions[userId].rooms.includes(roomId)) {
      totalInterestedPeople++;
    }
  }

  if (totalInterestedPeople == 1) {
    return true
  }
  return false
};

const lastPersonLeftRoom = (roomId: string) => {
  let totalInterestedPeople = 0;
  for (const userId in subscriptions) {
    if (subscriptions[userId].rooms.includes(roomId)) {
      totalInterestedPeople++;
    }
  }

  if (totalInterestedPeople == 0) {
    return true
  }
  return false
}

const randomID = () => {
  return Math.random();
};

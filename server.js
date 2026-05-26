require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { initNotificationSocket, closeNotificationSocket } = require("./src/sockets/notification.socket");
const { closeEventBus } = require("./src/services/eventBus.service");
const { closeRedis } = require("./src/dbs/init.redis");
const PORT = process.env.PORT || 5500;

const server = http.createServer(app);

initNotificationSocket(server).catch((error) => {
  console.error("Realtime notification init failed:", error.message);
});

server.listen(PORT, () => {
  console.log("xin chao");
});

process.on("SIGINT", () => {
  server.close(async () => {
    await closeNotificationSocket();
    await closeEventBus();
    await closeRedis();
    console.log("Exit Server Express");
  });
});

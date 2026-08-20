require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { initNotificationSocket, closeNotificationSocket } = require("./src/sockets/notification.socket");
const { closeEventBus } = require("./src/services/eventBus.service");
const { startEventConsumer, closeEventConsumer } = require("./src/services/eventConsumer.service");
const { closeRedis } = require("./src/dbs/init.redis");
const myLogger = require("./src/loggers/myLogger.log");
const PORT = process.env.PORT || 5500;

const server = http.createServer(app);

initNotificationSocket(server).catch((error) => {
  myLogger.error("Realtime notification init failed", [
    "server",
    { requestId: "system" },
    { message: error.message },
  ]);
});

startEventConsumer().catch((error) => {
  myLogger.error("Event consumer init failed", [
    "server",
    { requestId: "system" },
    { message: error.message },
  ]);
});

server.listen(PORT, () => {
  myLogger.log("HTTP server started", [
    "server",
    { requestId: "system" },
    { port: PORT },
  ]);
});

process.on("SIGINT", () => {
  server.close(async () => {
    await closeNotificationSocket();
    await closeEventConsumer();
    await closeEventBus();
    await closeRedis();
    myLogger.log("HTTP server stopped", ["server", { requestId: "system" }]);
  });
});

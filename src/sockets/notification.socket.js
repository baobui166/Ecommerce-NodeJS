"use strict";

const JWT = require("jsonwebtoken");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { findById: findApiKey } = require("../services/apiKey.service");
const { findByUserID } = require("../services/ketToken.service");
const { createRedisClient } = require("../dbs/init.redis");

const NOTIFICATION_CHANNEL = process.env.NOTIFICATION_REDIS_CHANNEL || "notifications:new";

let io = null;
let redisSubscriber = null;
let redisPubClient = null;
let redisSubClient = null;

const getHeader = (socket, key) =>
  socket.handshake.auth?.[key] ||
  socket.handshake.headers?.[key] ||
  socket.handshake.headers?.[key.toLowerCase()];

const getBearerToken = (authorization = "") => {
  if (!authorization) return null;
  const [scheme, token] = String(authorization).split(" ");
  if (/^Bearer$/i.test(scheme) && token) return token;
  return authorization;
};

const authenticateSocket = async (socket, next) => {
  try {
    const apiKey = getHeader(socket, "x-api-key");
    const clientId = getHeader(socket, "x-client-id");
    const authorization = getHeader(socket, "authorization") || getHeader(socket, "Authorization");

    if (!apiKey || !(await findApiKey(String(apiKey)))) {
      return next(new Error("Invalid API key"));
    }

    if (!clientId) return next(new Error("Missing client id"));

    const keyStore = await findByUserID(String(clientId));
    if (!keyStore) return next(new Error("Invalid session"));

    const accessToken = getBearerToken(authorization);
    if (!accessToken) return next(new Error("Missing access token"));

    const decoded = JWT.verify(accessToken, keyStore.publicKey);
    if (String(decoded.userId) !== String(clientId)) {
      return next(new Error("Invalid client"));
    }

    socket.user = decoded;
    return next();
  } catch (error) {
    return next(new Error(error.message || "Socket authentication failed"));
  }
};

const emitNotification = (notification) => {
  if (!io || !notification) return;

  if (notification.recipientType === "admin") {
    io.to("admin").emit("notification:new", notification);
    return;
  }

  if (notification.recipientId) {
    io.to(`user:${notification.recipientId}`).emit("notification:new", notification);
  }
};

const subscribeToNotifications = async () => {
  redisSubscriber = createRedisClient();
  await redisSubscriber.connect();
  await redisSubscriber.subscribe(NOTIFICATION_CHANNEL, (message) => {
    try {
      emitNotification(JSON.parse(message));
    } catch (error) {
      console.error("Invalid notification pub/sub payload:", error.message);
    }
  });
};

const installRedisAdapter = async () => {
  redisPubClient = createRedisClient();
  redisSubClient = redisPubClient.duplicate();

  await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
  io.adapter(createAdapter(redisPubClient, redisSubClient));
};

const initNotificationSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  try {
    await installRedisAdapter();
  } catch (error) {
    console.error(`Socket.IO Redis adapter unavailable: ${error.message}`);
  }

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const user = socket.user || {};
    if (user.role === "admin" || user.type === "shop") {
      socket.join("admin");
    } else {
      socket.join(`user:${user.userId}`);
    }
  });

  try {
    await subscribeToNotifications();
  } catch (error) {
    console.error(`Notification Redis subscriber unavailable: ${error.message}`);
  }

  return io;
};

const closeNotificationSocket = async () => {
  await redisSubscriber?.quit().catch(() => {});
  await redisSubClient?.quit().catch(() => {});
  await redisPubClient?.quit().catch(() => {});
  io?.close();
};

module.exports = {
  initNotificationSocket,
  closeNotificationSocket,
  emitNotification,
  NOTIFICATION_CHANNEL,
};

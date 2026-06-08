"use strict";

const redis = require("redis");
const myLogger = require("../loggers/myLogger.log");

let client = {};

const REDIS_CONNECT_TIMEOUT = 10000;

const REDIS_CONNECT_MESSAGE = {
  code: -99,
  message: {
    vn: "Redis bi loi roi",
    en: "Redis connection error",
  },
};

let connectionTimeout;

const handleTimeOutError = () => {
  connectionTimeout = setTimeout(() => {
    myLogger.error(REDIS_CONNECT_MESSAGE.message.en, [
      "redis",
      { requestId: "system" },
    ]);
  }, REDIS_CONNECT_TIMEOUT);
};

const handleEventConnect = ({ connectionRedis }) => {
  connectionRedis.on("connect", () => {
    myLogger.log("Redis connected", ["redis", { requestId: "system" }]);
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on("end", () => {
    myLogger.log("Redis ended", ["redis", { requestId: "system" }]);
  });

  connectionRedis.on("reconnecting", () => {
    myLogger.log("Redis reconnecting", ["redis", { requestId: "system" }]);
  });

  connectionRedis.on("error", (err) => {
    myLogger.error("Redis error", [
      "redis",
      { requestId: "system" },
      { message: err.message },
    ]);
    handleTimeOutError();
  });
};

const buildRedisOptions = () => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  const options = {
    socket: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
    database: Number(process.env.REDIS_DB) || 0,
  };

  if (process.env.REDIS_PASSWORD) {
    options.password = process.env.REDIS_PASSWORD;
  }

  return options;
};

const createRedisClient = () => {
  const instanceRedis = redis.createClient(buildRedisOptions());
  handleEventConnect({ connectionRedis: instanceRedis });
  return instanceRedis;
};

const initRedis = async () => {
  const instanceRedis = createRedisClient();
  await instanceRedis.connect();

  client.instanceConnect = instanceRedis;
};

const getRedis = () => client;

const closeRedis = async () => {
  if (!client.instanceConnect) {
    myLogger.log("Redis close skipped: no active connection", [
      "redis",
      { requestId: "system" },
    ]);
    return;
  }

  try {
    await client.instanceConnect.quit();
    client.instanceConnect = null;
    myLogger.log("Redis connection closed", ["redis", { requestId: "system" }]);
  } catch (err) {
    myLogger.error("Error closing Redis", [
      "redis",
      { requestId: "system" },
      { message: err.message },
    ]);
    await client.instanceConnect?.disconnect();
  }
};

module.exports = { initRedis, getRedis, closeRedis, createRedisClient };

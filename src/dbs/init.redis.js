"use strict";

const redis = require("redis");

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
    console.error(REDIS_CONNECT_MESSAGE.message.en);
  }, REDIS_CONNECT_TIMEOUT);
};

const handleEventConnect = ({ connectionRedis }) => {
  connectionRedis.on("connect", () => {
    console.log("Redis connected");
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on("end", () => {
    console.log("Redis ended");
  });

  connectionRedis.on("reconnecting", () => {
    console.log("Redis reconnecting");
  });

  connectionRedis.on("error", (err) => {
    console.error("Redis error:", err);
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
    console.log("closeRedis - No active connection");
    return;
  }

  try {
    await client.instanceConnect.quit();
    client.instanceConnect = null;
    console.log("Redis connection closed");
  } catch (err) {
    console.error("Error closing Redis:", err);
    await client.instanceConnect?.disconnect();
  }
};

module.exports = { initRedis, getRedis, closeRedis, createRedisClient };

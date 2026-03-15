"use strict";

const redis = require("redis");
const { RedisErrorResponse } = require("../core/error.response");

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
    throw new RedisErrorResponse({
      message: REDIS_CONNECT_MESSAGE.message.en,
      statusCode: REDIS_CONNECT_MESSAGE.code,
    });
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

const initRedis = async () => {
  const redisUrl = `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${
    process.env.REDIS_PORT || 6379
  }`;

  const instanceRedis = redis.createClient({
    url: redisUrl,
    password: process.env.REDIS_PASSWORD || undefined,
    database: Number(process.env.REDIS_DB) || 0,
  });

  handleEventConnect({ connectionRedis: instanceRedis });

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

module.exports = { initRedis, getRedis, closeRedis };
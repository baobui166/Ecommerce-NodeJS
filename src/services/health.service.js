"use strict";

const mongoose = require("mongoose");
const { getRedis } = require("../dbs/init.redis");

let amqp = null;
try {
  amqp = require("amqplib");
} catch {
  amqp = null;
}

const withTimeout = async (promise, timeoutMs, label) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
};

const checkMongo = () => {
  const readyState = mongoose.connection.readyState;
  return {
    status: readyState === 1 ? "up" : "down",
    readyState,
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
};

const checkRedis = async () => {
  const redisClient = getRedis().instanceConnect;
  if (!redisClient?.isOpen) {
    return { status: "down", isOpen: false };
  }

  await withTimeout(redisClient.ping(), 1500, "Redis readiness");
  return { status: "up", isOpen: true };
};

const checkRabbit = async () => {
  if (!amqp) return { status: "down", reason: "amqplib unavailable" };

  const connection = await withTimeout(
    amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost"),
    2000,
    "RabbitMQ readiness",
  );

  await connection.close().catch(() => {});
  return { status: "up" };
};

const getHealth = () => ({
  status: "ok",
  service: "server-backend-ecommerce",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
});

const getReadiness = async () => {
  const checks = {
    mongo: checkMongo(),
    redis: { status: "unknown" },
    rabbitmq: { status: "unknown" },
  };

  const [redisResult, rabbitResult] = await Promise.allSettled([
    checkRedis(),
    checkRabbit(),
  ]);

  checks.redis =
    redisResult.status === "fulfilled"
      ? redisResult.value
      : { status: "down", reason: redisResult.reason.message };
  checks.rabbitmq =
    rabbitResult.status === "fulfilled"
      ? rabbitResult.value
      : { status: "down", reason: rabbitResult.reason.message };

  const ready = Object.values(checks).every((check) => check.status === "up");

  return {
    status: ready ? "ready" : "not_ready",
    ready,
    checks,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHealth,
  getReadiness,
};

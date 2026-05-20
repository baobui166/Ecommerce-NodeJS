"use strict";

const { randomUUID } = require("crypto");

let amqp;
try {
  amqp = require("amqplib");
} catch {
  amqp = null;
}

const EVENT_QUEUE = process.env.EVENT_QUEUE || "ecommerce.events";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

const publishEvent = async ({ type, userId, orderId, metadata = {} }) => {
  const event = {
    eventId: randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    ...(userId ? { userId: userId.toString() } : {}),
    ...(orderId ? { orderId: orderId.toString() } : {}),
    metadata,
  };

  if (!amqp) return event;

  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(EVENT_QUEUE, { durable: true });
    channel.sendToQueue(EVENT_QUEUE, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: "application/json",
      messageId: event.eventId,
      type,
    });
    await channel.close();
  } catch (error) {
    console.error(`Event publish skipped (${type}):`, error.message);
  } finally {
    if (connection) await connection.close().catch(() => {});
  }

  return event;
};

module.exports = { publishEvent, EVENT_QUEUE };

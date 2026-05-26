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
const DLX_EXCHANGE = process.env.EVENT_DLX_EXCHANGE || "ecommerce.events.dlx";

let connection = null;
let channel = null;
let connecting = null;

const resetConnection = () => {
  channel = null;
  connection = null;
  connecting = null;
};

const getChannel = async () => {
  if (!amqp) return null;
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on("close", resetConnection);
    connection.on("error", (error) => {
      console.error("RabbitMQ connection error:", error.message);
    });

    channel = await connection.createConfirmChannel();
    channel.on("close", () => {
      channel = null;
    });
    channel.on("error", (error) => {
      console.error("RabbitMQ channel error:", error.message);
    });

    await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
    await channel.assertQueue(EVENT_QUEUE, {
      durable: true,
      deadLetterExchange: DLX_EXCHANGE,
      deadLetterRoutingKey: "failed",
    });
    return channel;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

const publishEvent = async ({ eventId, type, userId, orderId, metadata = {} }) => {
  const event = {
    eventId: eventId || randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    ...(userId ? { userId: userId.toString() } : {}),
    ...(orderId ? { orderId: orderId.toString() } : {}),
    metadata,
  };

  try {
    const eventChannel = await getChannel();
    if (!eventChannel) return event;

    eventChannel.sendToQueue(
      EVENT_QUEUE,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
        messageId: event.eventId,
        type,
      },
    );
    await eventChannel.waitForConfirms();
  } catch (error) {
    console.error(`Event publish skipped (${type}):`, error.message);
    resetConnection();
  }

  return event;
};

const closeEventBus = async () => {
  await channel?.close().catch(() => {});
  await connection?.close().catch(() => {});
  resetConnection();
};

module.exports = { publishEvent, closeEventBus, EVENT_QUEUE };

"use strict";

let amqp;
try {
  amqp = require("amqplib");
} catch {
  amqp = null;
}

const myLogger = require("../loggers/myLogger.log");
const NotificationService = require("./notification.service");
const { createRedisClient } = require("../dbs/init.redis");
const { NOTIFICATION_CHANNEL } = require("../sockets/notification.socket");

const EVENT_QUEUE = process.env.EVENT_QUEUE || "ecommerce.events";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const DLX_EXCHANGE = process.env.EVENT_DLX_EXCHANGE || "ecommerce.events.dlx";

const ORDER_STATUS_LABELS = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "being processed",
  shipping: "shipped",
  shipped: "shipped",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
};

// Maps a queued domain event to a single-recipient notification. Events with
// no well-defined single recipient (e.g. a promotion broadcast to every
// customer) are intentionally skipped rather than half-implemented.
const buildNotificationForEvent = (event) => {
  switch (event.type) {
    case "order.status_changed": {
      if (!event.userId) return null;
      const status = event.metadata?.status;
      const statusLabel = ORDER_STATUS_LABELS[status] || status || "updated";
      return {
        recipientType: "user",
        recipientId: event.userId,
        type: "order",
        title: "Order status updated",
        message: `Your order has been ${statusLabel}.`,
        link: event.orderId ? `/account/orders/${event.orderId}` : "",
        data: { orderId: event.orderId, status },
      };
    }

    case "order.created": {
      const total = event.metadata?.totalCheckout;
      return {
        recipientType: "admin",
        type: "order",
        title: "New order placed",
        message: total ? `A new order was placed for ${total}.` : "A new order was placed.",
        link: event.orderId ? `/admin/orders/${event.orderId}` : "",
        data: { orderId: event.orderId },
      };
    }

    case "product.low_stock": {
      const { productId, productName, quantity } = event.metadata || {};
      const name = productName || "A product";
      const outOfStock = Number(quantity) <= 0;
      return {
        recipientType: "admin",
        type: "inventory",
        title: outOfStock ? "Product out of stock" : "Low stock alert",
        message: outOfStock
          ? `${name} is now out of stock.`
          : `${name} is running low (${quantity} left).`,
        link: "/admin/products",
        data: { productId, quantity },
      };
    }

    case "user.registered": {
      const email = event.metadata?.email;
      return {
        recipientType: "admin",
        type: "system",
        title: "New user registered",
        message: email ? `${email} just signed up.` : "A new user just signed up.",
        data: { userId: event.userId },
      };
    }

    default:
      return null;
  }
};

let connection = null;
let channel = null;
let redisPublisher = null;

const getRedisPublisher = async () => {
  if (redisPublisher) return redisPublisher;
  redisPublisher = createRedisClient();
  await redisPublisher.connect();
  return redisPublisher;
};

const processEvent = async (event) => {
  const notificationInput = buildNotificationForEvent(event);
  if (!notificationInput) return;

  const notification = await NotificationService.createNotification(notificationInput);
  const publisher = await getRedisPublisher();
  await publisher.publish(
    NOTIFICATION_CHANNEL,
    JSON.stringify(NotificationService.mapNotification(notification)),
  );
};

const startEventConsumer = async () => {
  if (!amqp) {
    myLogger.error("amqplib not installed, event consumer disabled", [
      "event-consumer",
      { requestId: "system" },
    ]);
    return;
  }

  connection = await amqp.connect(RABBITMQ_URL);
  connection.on("error", (error) => {
    myLogger.error("Event consumer connection error", [
      "event-consumer",
      { requestId: "system" },
      { message: error.message },
    ]);
  });

  channel = await connection.createChannel();
  await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
  await channel.assertQueue(EVENT_QUEUE, {
    durable: true,
    deadLetterExchange: DLX_EXCHANGE,
    deadLetterRoutingKey: "failed",
  });
  await channel.prefetch(10);

  await channel.consume(EVENT_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      await processEvent(event);
      channel.ack(msg);
    } catch (error) {
      myLogger.error("Failed to process event", [
        "event-consumer",
        { requestId: "system" },
        { message: error.message },
      ]);
      channel.nack(msg, false, false);
    }
  });

  myLogger.log("Event consumer started", [
    "event-consumer",
    { requestId: "system" },
    { queue: EVENT_QUEUE },
  ]);
};

const closeEventConsumer = async () => {
  await redisPublisher?.quit().catch(() => {});
  await channel?.close().catch(() => {});
  await connection?.close().catch(() => {});
};

module.exports = { startEventConsumer, closeEventConsumer };

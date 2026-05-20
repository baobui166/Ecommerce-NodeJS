"use strict";

const { setTimeout } = require("timers/promises");
const { reservationInventory } = require("../model/repositories/inventory.repo");
const { getRedis } = require("../dbs/init.redis");

const acquireLock = async (productId, quantity, cartId) => {
  const { instanceConnect: redisClient } = getRedis();

  if (!redisClient) {
    const isReservation = await reservationInventory({
      productId,
      quantity,
      cartId,
    });
    return isReservation.modifiedCount ? `inventory_${productId}` : null;
  }

  const key = `lock_v2025_${productId}`;

  const retryTime = 10;
  const expireTime = 3000;

  for (let i = 0; i < retryTime; i++) {
    const result = await redisClient.set(key, "lock", {
      NX: true,
      PX: expireTime,
    });

    if (result) {
      const isReservation = await reservationInventory({
        productId,
        quantity,
        cartId,
      });

      if (isReservation.modifiedCount) {
        return key;
      }

      await redisClient.del(key);
      return null;
    } else {
      await setTimeout(50);
    }
  }

  return null;
};

const releaseLock = async (keyLock) => {
  const { instanceConnect: redisClient } = getRedis();
  if (!redisClient || keyLock.startsWith("inventory_")) return true;
  return await redisClient.del(keyLock);
};

module.exports = {
  acquireLock,
  releaseLock,
};

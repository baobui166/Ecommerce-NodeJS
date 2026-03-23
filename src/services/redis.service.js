"use strict";

const { setTimeout } = require("timers/promises");
const { reservationInventory } = require("../model/repositories/inventory.repo");
const { getRedis } = require("../dbs/init.redis");

const { instanceConnect: redisClient } = getRedis();

const acquireLock = async (productId, quantity, cartId) => {
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
  return await redisClient.del(keyLock);
};

module.exports = {
  acquireLock,
  releaseLock,
};

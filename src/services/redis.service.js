"use strict"

const redis = require("redis")
const { setTimeout } = require("timers/promises")
const { reservationInventory } = require("../model/repositories/invetory.repo")

const redisClient = redis.createClient()

const acquireLock = async (productId, quantity, cartId) => {
  const key = `lock_v2025_${productId}`
  const retryTime = 10
  const expireTime = 3000 // ms

  for (let i = 0; i < retryTime; i++) {
    // setNX trả về true nếu set thành công
    const result = await redisClient.setNX(key, expireTime)

    if (result) {
      // thao tác với inventory
      const isReservation = await reservationInventory({
        productId,
        quantity,
        cartId
      })

      if (isReservation.modifiedCount) {
        // đặt expire cho key
        await redisClient.pExpire(key, expireTime)
        return key
      }

      return null
    } else {
      // chờ 50ms rồi thử lại
      await setTimeout(50)
    }
  }
}

const releaseLock = async (keyLock) => {
  return await redisClient.del(keyLock)
}

module.exports = {
  acquireLock,
  releaseLock
}

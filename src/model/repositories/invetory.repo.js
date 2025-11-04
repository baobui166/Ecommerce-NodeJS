"use strict"

const { convertToObjectIdMongodb } = require("../../utils")
const { inventory } = require("../inventory.model")

const insertInventory = async ({ productId, shopId, stock, location }) => {
  return await inventory.create({
    inventory_productId: productId,
    inventory_location: location,
    inventory_stock: stock,
    inventory_shopId: shopId
  })
}

const reservationInventory = async ({ productId, quantity, cartId }) => {
  const query = {
      inven_productId: convertToObjectIdMongodb(productId),
      inven_stock: { $gte: quantity }
    },
    updateSet = {
      $inc: { inven_stock: -quantity },
      $push: { inven_reservations: { quantity, cartId, createOn: new Date() } }
    },
    options = { upsert: true, new: true }

  return await inventory.updateOne(query, updateSet, options)
}

module.exports = { insertInventory, reservationInventory }

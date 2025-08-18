"use strict"

const inventoryModel = require("../model/inventory.model")
const { getProductById } = require("../model/repositories/product.repo")
const { BadRequestError, NotFoundError } = require("../core/error.response")

class InventoryService {
  static async addStockToInventory({
    stock,
    productId,
    shopId,
    location = "123, tran phu, tp ho chi minh"
  }) {
    const product = await getProductById(productId)
    if (!product) throw new BadRequestError("The product does not exists!!")
    const query = { inven_shopId: shopId, inven_productId: productId },
      updateSet = {
        $inc: { inven_stock: stock },
        $set: { inven_location: location }
      },
      options = { upsert: true, new: true }

    return await inventoryModel.inventory.findOneAndUpdate(
      query,
      updateSet,
      options
    )
  }
}

module.exports = InventoryService

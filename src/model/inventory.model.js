"use strict"

const { lowerCase } = require("lodash")
const { model, Schema } = require("mongoose") // Erase if already required
const slugify = require("slugify")
const DOCUMENT_NAME = "Inventory"
const COLECTION_NAME = "Inventories"

// Declare the Schema of the Mongo model
var inventorySchema = new Schema(
  {
    inventory_productId: { type: Schema.Types.ObjectId, ref: "Product" },
    inventory_location: { type: String, default: "unKnown" },
    inventory_stock: { type: Number, require: true },
    inventory_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    inventory_reservation: { type: Array, default: [] }
  },
  { timestamps: true, collection: COLECTION_NAME }
)

//Export the model
module.exports = {
  inventory: model(DOCUMENT_NAME, inventorySchema)
}

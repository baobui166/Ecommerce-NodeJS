"use strict"

const { model, Schema } = require("mongoose") // Erase if already required
const DOCUMENT_NAME = "Product"
const COLECTION_NAME = "Products"

// Declare the Schema of the Mongo model
var productSchema = new Schema(
  {
    product_name: {
      type: String,
      require: true
    },
    product_thumb: {
      type: String,
      require: true
    },
    product_descriptions: {
      type: String
    },
    product_price: {
      type: Number,
      require: true
    },
    product_quantity: {
      type: Number,
      require: true
    },
    product_type: {
      type: String,
      require: true,
      enum: ["Electronics", "Clothing", "Furniture"]
    },
    product_shop: {
      type: { type: Schema.Types.ObjectId, ref: "Shop" }
    },
    product_attributes: {
      type: Schema.Types.Mixed,
      require: true
    }
  },
  { timestamps: true, collection: COLECTION_NAME }
)

// define the product type = clothing
const clothingSchema = new Schema(
  {
    brand: { type: String, require: true },
    size: String,
    material: String,
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" }
  },
  {
    timestamps: true,
    collection: "clothes"
  }
)

// define the product type = electronic
const electronicSchema = new Schema(
  {
    manufacture: { type: String, require: true },
    model: String,
    color: String,
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" }
  },
  {
    timestamps: true,
    collection: "electronics"
  }
)

const furnitureSchema = new Schema(
  {
    manufacture: { type: String, require: true },
    model: String,
    color: String,
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" }
  },
  {
    timestamps: true,
    collection: "furnitures"
  }
)

//Export the model
module.exports = {
  product: model(DOCUMENT_NAME, productSchema),
  clothing: model("Clothing", clothingSchema),
  electronic: model("Electronics", electronicSchema),
  furniture: model("Furniture", furnitureSchema)
}

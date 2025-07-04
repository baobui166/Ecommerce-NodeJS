"use strict"

const { model, Schema, SchemaType } = require("mongoose") // Erase if already required
const DOCUMENT_NAME = "Discount"
const COLECTION_NAME = "Discounts"

// Declare the Schema of the Mongo model
var discountSchema = new Schema(
  {
    discount_name: { type: String, require: true },
    discount_description: { type: String, default: true },
    discount_type: { type: String, default: "fixed_amount" }, // percentage
    discount_value: { type: Number, default: true }, //10,0000
    discount_max_value: { type: Number, default: true }, //10,0000
    discount_code: { type: String, default: true }, // discountcode
    discount_start_date: { type: Date, default: true },
    discount_end_date: { type: Date, default: true },
    discount_max_uses: { type: Number, default: true }, // quantities discount will use
    discount_uses_count: { tye: Number, default: true }, // quantities used
    discount_users_count: { tye: Array, default: [] }, // who use discount
    discount_max_uses_per_users: { tye: Array, default: [] }, // maximum people will use it
    discount_min_order_value: { tye: Array, default: [] }, // min value of order for apply discount
    discount_shopId: { tye: Schema.Types.ObjectId, ref: "Shop" },
    discount_is_active: {
      tye: Boolean,
      default: true
    },
    discount_applies_to: {
      tye: String,
      default: true,
      enum: ["all", "specific"]
    },
    discount_product_ids: {
      tye: Array,
      default: []
    }
  },
  { timestamps: true, collection: COLECTION_NAME }
)

//Export the model
module.exports = model(DOCUMENT_NAME, discountSchema)

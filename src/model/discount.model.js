"use strict"

const { model, Schema } = require("mongoose") // Erase if already required
const DOCUMENT_NAME = "Discount"
const COLLECTION_NAME = "Discounts"

// Declare the Schema of the Mongo model
var discountSchema = new Schema(
  {
    discount_name: { type: String, required: true },
    discount_description: { type: String, required: true },
    discount_type: { type: String, default: "fixed_amount" }, // percentage
    discount_value: { type: Number, required: true }, // 10,0000
    discount_max_value: { type: Number, required: true }, // 10,0000
    discount_code: { type: String, required: true }, // discount code
    discount_start_date: { type: Date, required: true },
    discount_end_date: { type: Date, required: true },
    discount_max_uses: { type: Number, required: true }, // quantities discount will use
    discount_uses_count: { type: Number, required: true }, // quantities used
    discount_users_count: { type: Array, default: [] }, // who use discount
    discount_max_uses_per_users: { type: Array, default: [] }, // maximum people will use it
    discount_min_order_value: { type: Array, default: [] }, // min value of order for apply discount
    discount_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    discount_is_active: {
      type: Boolean,
      required: true
    },
    discount_applies_to: {
      type: String,
      required: true,
      enum: ["all", "specific"]
    },
    discount_product_ids: {
      type: Array,
      default: []
    }
  },
  { timestamps: true, collection: COLLECTION_NAME }
)

// Export the model
module.exports = model(DOCUMENT_NAME, discountSchema)

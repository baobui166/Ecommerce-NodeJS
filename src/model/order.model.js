"use strict";

const { model, Schema } = require("mongoose"); // Erase if already required
const DOCUMENT_NAME = "Order";
const COLLECTION_NAME = "Orders";

// Declare the Schema of the Mongo model
var orderSchema = new Schema(
  {
    order_userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order_shopId: { type: Schema.Types.ObjectId, ref: "Shop", index: true },
    /*
	  order_checkout = {
	  	totalPrice,
		totalApplyDiscount,
		feeShip,...
	 
	  }
	*/
    order_checkout: { type: Object, default: {} },
    /*
	order_shipping: {
		street,
		state,
		city,
		country
	}
	*/
    order_shipping: { type: Object, default: {} },
    order_payment: { type: Object, default: {} },
    order_products: { type: Array, required: true },
    order_trackingNumber: { type: String, default: "#000011" },
    order_status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "cancelled", "delivered"],
      default: "pending",
    },
    order_statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: ["pending", "confirmed", "processing", "shipped", "cancelled", "delivered"],
            required: true,
          },
          changedBy: { type: Schema.Types.ObjectId, default: null },
          changedByType: {
            type: String,
            enum: ["system", "user", "admin", "shop"],
            default: "system",
          },
          note: { type: String, trim: true, default: "" },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
    collection: COLLECTION_NAME,
  },
);

orderSchema.index({ createdOn: -1 });
orderSchema.index({ order_userId: 1, createdOn: -1 });
orderSchema.index({ order_shopId: 1, order_status: 1, createdOn: -1 });

// Export the model
module.exports = model(DOCUMENT_NAME, orderSchema);

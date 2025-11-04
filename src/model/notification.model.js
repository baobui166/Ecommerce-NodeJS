" use strict";

const { model, Schema } = require("mongoose");
const { schema } = require("./order.model");

const DOCUMENT_NAME = "Notification";
const COLLECTION_NAME = "Notifications";
// order001: order success
// order002: order fail
// promotion001: new promotion
// SHOP-001: new product for User following
const notificationSchema = new Schema(
  {
    noti_type: {
      type: String,
      enum: ["ORDER-001", "ORDER-002", "PROMOTION-001", "SHOP-001"],
      required: true,
    },
    noti_senderId: { type: Schema.Types.ObjectId, required: true, ref: "Shop" },
    noti_recivedId: {
      type: Number,
      required: true,
    },
    noti_content: { type: String, required: true },
    noti_options: { type: Object, default: {} },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, notificationSchema);

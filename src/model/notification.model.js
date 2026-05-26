"use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Notification";
const COLLECTION_NAME = "Notifications";

const notificationSchema = new Schema(
  {
    recipientType: {
      type: String,
      enum: ["user", "admin"],
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      refPath: "recipientModel",
      index: true,
      default: null,
    },
    recipientModel: {
      type: String,
      enum: ["User", "Shop"],
      default: null,
    },
    type: {
      type: String,
      enum: ["order", "promotion", "system", "inventory", "payment"],
      default: "system",
      index: true,
    },
    title: { type: String, trim: true, default: "Notification" },
    message: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
    data: { type: Object, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },

    // Legacy fields kept so existing documents can still be read/mapped.
    noti_type: { type: String },
    noti_senderId: { type: Schema.Types.ObjectId, ref: "Shop" },
    noti_recivedId: {
      type: Number,
    },
    noti_content: { type: String },
    noti_options: { type: Object, default: {} },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  },
);

notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });

module.exports = model(DOCUMENT_NAME, notificationSchema);

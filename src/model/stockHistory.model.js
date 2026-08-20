"use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "StockHistory";
const COLLECTION_NAME = "StockHistories";

const stockHistorySchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    delta: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reason: { type: String, trim: true, default: "" },
    changedBy: { type: Schema.Types.ObjectId, ref: "Shop" },
  },
  { timestamps: true, collection: COLLECTION_NAME },
);

stockHistorySchema.index({ product: 1, createdAt: -1 });

module.exports = model(DOCUMENT_NAME, stockHistorySchema);

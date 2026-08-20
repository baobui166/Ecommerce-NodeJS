"use strict";

const { publishEvent } = require("./eventBus.service");

const LOW_STOCK_THRESHOLD = 5;

// Called after any stock-changing write (order decrement, restock adjustment)
// with the product's post-write state, so it fires exactly once per crossing
// instead of needing a separate polling job.
const notifyLowStockIfNeeded = (updatedProduct) => {
  if (!updatedProduct) return;

  const quantity = Number(updatedProduct.product_quantity);
  if (!Number.isFinite(quantity) || quantity > LOW_STOCK_THRESHOLD) return;

  publishEvent({
    type: "product.low_stock",
    metadata: {
      productId: updatedProduct._id,
      productName: updatedProduct.product_name,
      quantity,
    },
  }).catch(() => {});
};

module.exports = { notifyLowStockIfNeeded, LOW_STOCK_THRESHOLD };

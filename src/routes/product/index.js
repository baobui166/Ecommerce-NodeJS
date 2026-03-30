"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const productController = require("../../controller/product.controller");
const router = express.Router();

router.post(
  "/search/:keySearch",
  asyncHandler(productController.getListSearchProductByUser),
);
router.get("/", asyncHandler(productController.findAllProducts));
router.get("/types", asyncHandler(productController.getAllProductTypes));
router.get("/:product_id", asyncHandler(productController.findProduct));

// authentication
router.post(
  "/",
  authentication,
  asyncHandler(productController.createNewProduct),
);
router.patch(
  "/:productId",
  authentication,
  asyncHandler(productController.updateProduct),
);
router.delete(
  "/:productId",
  authentication,
  asyncHandler(productController.deleteProduct),
);
router.post(
  "/publish/:id",
  authentication,
  asyncHandler(productController.publishProduct),
);
router.post(
  "/unpublish/:id",
  authentication,
  asyncHandler(productController.unPublishProduct),
);
//QUERY
router.get(
  "/drafts/all",
  authentication,
  asyncHandler(productController.getAllDraftsForShop),
);
router.get(
  "/published/all",
  authentication,
  asyncHandler(productController.getAllPublishForShop),
);

module.exports = router;

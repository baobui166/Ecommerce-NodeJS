"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { requireAdmin } = require("../../middlewares/admin.middleware");
const { asyncHandler } = require("../../helpers/asyncHandler");
const productController = require("../../controller/product.controller");
const { searchLimiter } = require("../../middlewares/rateLimit.middleware");
const router = express.Router();

router.post(
  "/search/:keySearch",
  searchLimiter,
  asyncHandler(productController.getListSearchProductByUser),
);
router.get("/suggestions", searchLimiter, asyncHandler(productController.getProductSuggestions));
router.get("/", asyncHandler(productController.findAllProducts));
router.get("/types", asyncHandler(productController.getAllProductTypes));
router.get("/home-sections", asyncHandler(productController.getHomeSections));
router.get("/featured", asyncHandler(productController.getFeaturedProducts));
router.get("/favorites", asyncHandler(productController.getCustomerFavoriteProducts));
router.get(
  "/inventory/alerts",
  authentication,
  requireAdmin,
  asyncHandler(productController.getInventoryAlerts),
);
//QUERY
router.get(
  "/drafts/all",
  authentication,
  requireAdmin,
  asyncHandler(productController.getAllDraftsForShop),
);
router.get(
  "/published/all",
  authentication,
  requireAdmin,
  asyncHandler(productController.getAllPublishForShop),
);
router.get("/:product_id", asyncHandler(productController.findProduct));

// authentication
router.post(
  "/",
  authentication,
  requireAdmin,
  asyncHandler(productController.createNewProduct),
);
router.patch(
  "/:productId",
  authentication,
  requireAdmin,
  asyncHandler(productController.updateProduct),
);
router.delete(
  "/:productId",
  authentication,
  requireAdmin,
  asyncHandler(productController.deleteProduct),
);
router.post(
  "/publish/:id",
  authentication,
  requireAdmin,
  asyncHandler(productController.publishProduct),
);
router.post(
  "/unpublish/:id",
  authentication,
  requireAdmin,
  asyncHandler(productController.unPublishProduct),
);

module.exports = router;

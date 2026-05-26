"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { requireActiveUser } = require("../../middlewares/userStatus.middleware");
const wishlistController = require("../../controller/wishlist.controller");

const router = express.Router();

router.get(
  "/",
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(wishlistController.getWishlist),
);
router.post(
  "/",
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(wishlistController.addProduct),
);
router.delete(
  "/",
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(wishlistController.clearWishlist),
);
router.delete(
  "/:productId",
  authentication,
  asyncHandler(requireActiveUser),
  asyncHandler(wishlistController.removeProduct),
);

module.exports = router;

"use strict";

const express = require("express");
const { authentication } = require("../../auth/authUtils");
const { asyncHandler } = require("../../helpers/asyncHandler");
const cartController = require("../../controller/cart.controller");

const router = express.Router();

/////// Authentication ///////

router.post("", authentication, asyncHandler(cartController.addToCart));
router.delete("", authentication, asyncHandler(cartController.delete));
router.post("/update", authentication, asyncHandler(cartController.update));
router.get("", authentication, asyncHandler(cartController.listToCart));

module.exports = router;

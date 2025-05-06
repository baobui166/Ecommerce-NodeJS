"use strict"

const express = require("express")
const { authentication } = require("../../auth/authUtils")
const { asyncHandler } = require("../../helpers/asyncHandler")
const productController = require("../../controller/product.controller")
const router = express.Router()

router.post(
  "/search/:keySearch",
  asyncHandler(productController.getListSearchProductByUser)
)

/////// Authentication ///////
router.use(authentication)
/////////////////////////////
router.post("/", asyncHandler(productController.createNewProduct))
router.post("/publish/:id", asyncHandler(productController.publishProduct))
router.post("/unpublish/:id", asyncHandler(productController.unPublishProduct))
//QUERY
router.get("/drafts/all", asyncHandler(productController.getAllDraftsForShop))
router.get(
  "/published/all",
  asyncHandler(productController.getAllPublishForShop)
)

module.exports = router

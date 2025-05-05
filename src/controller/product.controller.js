"use strict"

const { OK, CREATED, SuccessResponse } = require("../core/success.response")
const ProductServiceV2 = require("../services/product.service.xxx")

class ProductController {
  createNewProduct = async (req, res, next) => {
    // new SuccessResponse({
    //   message: "Create new Product success!!!",
    //   metadata: await ProductService.createProduct(req.body.product_type, {
    //     ...req.body,
    //     product_shop: req.user.userId
    //   })
    // }).send(res)
    //version 2
    new SuccessResponse({
      message: "Create new Product success!!!",
      metadata: await ProductServiceV2.createProduct(req.body.product_type, {
        ...req.body,
        product_shop: req.user.userId
      })
    }).send(res)
  }
}

module.exports = new ProductController()

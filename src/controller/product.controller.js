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

  // update Product
  updateProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Update product success!!!",
      metadata: await ProductServiceV2.updateProduct(
        req.body.product_type,
        req.params.productId,
        {
          ...req.body,
          product_shop: req.user.userId
        }
      )
    }).send(res)
  }

  publishProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Publish product by Shop success!!!",
      metadata: await ProductServiceV2.publishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.id
      })
    }).send(res)
  }

  unPublishProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "UnPublish product by Shop success!!!",
      metadata: await ProductServiceV2.unpublishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.id
      })
    }).send(res)
  }

  /**
   * @des Get all Drafts for shop
   * @param {Number} limit
   * @param {Number} skip
   * @return {JSON}
   */
  getAllDraftsForShop = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list Draft success!!!",
      metadata: await ProductServiceV2.findAllDraftsForShop({
        product_shop: req.user.userId
      })
    }).send(res)
  }

  /**
   * @des Get all publish for shop
   * @param {Number} limit
   * @param {Number} skip
   * @return {JSON}
   */
  getAllPublishForShop = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list publish success!!!",
      metadata: await ProductServiceV2.findAllPublishForShop({
        product_shop: req.user.userId
      })
    }).send(res)
  }

  getListSearchProductByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list search success!!!",
      metadata: await ProductServiceV2.searchProduct(req.params)
    }).send(res)
  }

  findAllProducts = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list findAllProduct success!!!",
      metadata: await ProductServiceV2.findAllProducts(req.query)
    }).send(res)
  }

  findProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Get product by findProduct success!!!",
      metadata: await ProductServiceV2.findProduct({
        product_id: req.params.product_id
      })
    }).send(res)
  }
}

module.exports = new ProductController()

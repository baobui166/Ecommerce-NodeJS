"use strict"

const { Types } = require("mongoose")
const {
  electronic,
  furniture,
  clothing,
  product
} = require("../../model/product.model")

const findAllDraftsForShop = async ({ query, limit, skip }) => {
  return await queryProduct({ query, limit, skip })
}

const searchProduct = async ({ keySearch }) => {
  const regexSearch = new RegExp(keySearch)
  const result = await product
    .find(
      {
        isPublish: true,
        $text: { $search: regexSearch }
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .lean()

  return result
}

const publishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id)
  })

  if (!foundShop) return null

  foundShop.isDraft = false
  foundShop.isPublish = true

  const { modifiedCount } = await foundShop.updateOne({
    $set: {
      isDraft: false,
      isPublish: true
    }
  })

  return modifiedCount
}

const unpublishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id)
  })

  if (!foundShop) return null
  foundShop.isDraft = true
  foundShop.isPublish = false

  const { modifiedCount } = await foundShop.updateOne({
    $set: {
      isDraft: true,
      isPublish: false
    }
  })

  return modifiedCount
}

const findAllPublishForShop = async ({ query, limit, skip }) => {
  return await queryProduct({ query, limit, skip })
}

const queryProduct = async ({ query, limit, skip }) => {
  return await product
    .find(query)
    .populate("product_shop", "name email -_id")
    .sort({ updateAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec()
}

module.exports = {
  findAllDraftsForShop,
  publishProductByShop,
  findAllPublishForShop,
  unpublishProductByShop,
  searchProduct
}

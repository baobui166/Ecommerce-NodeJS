"use strict";

const { Types } = require("mongoose");
const {
  electronic,
  furniture,
  clothing,
  product,
} = require("../../model/product.model");
const { getSelectData, unGetSelectData } = require("../../utils");

const queryProduct = async ({ query, limit, skip }) => {
  return await product
    .find(query)
    .populate("product_shop", "name email -_id")
    .sort({ updateAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

const countProduct = async (query) => {
  return await product.countDocuments(query).lean().exec();
};

const findAllDraftsForShop = async ({ query, limit, skip }) => {
  const [products, total] = await Promise.all([
    queryProduct({ query, limit, skip }),
    countProduct(query),
  ]);
  return {
    products,
    pagination: {
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const searchProduct = async ({ keySearch }) => {
  const regexSearch = new RegExp(keySearch);
  const result = await product
    .find(
      {
        isPublish: true,
        $text: { $search: regexSearch },
      },
      { score: { $meta: "textScore" } },
    )
    .sort({ score: { $meta: "textScore" } })
    .lean();

  return result;
};

const publishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });

  if (!foundShop) return null;

  foundShop.isDraft = false;
  foundShop.isPublish = true;

  const { modifiedCount } = await foundShop.updateOne({
    $set: {
      isDraft: false,
      isPublish: true,
    },
  });

  return modifiedCount;
};

const unpublishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });

  if (!foundShop) return null;
  foundShop.isDraft = true;
  foundShop.isPublish = false;

  const { modifiedCount } = await foundShop.updateOne({
    $set: {
      isDraft: true,
      isPublish: false,
    },
  });

  return modifiedCount;
};

const findAllPublishForShop = async ({ query, limit, skip }) => {
  const [products, total] = await Promise.all([
    queryProduct({ query, limit, skip }),
    countProduct(query),
  ]);
  return {
    products,
    pagination: {
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findAllProducts = async ({ limit, sort, page, filter, select }) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const products = await product
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean();

  return products;
};

const findAllProductsAdmin = async ({ limit, sort, page }) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { createdAt: -1 } : { createdAt: 1 };

  const [products, total] = await Promise.all([
    product
      .find({})
      .populate("product_shop", "name email")
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    product.countDocuments({}),
  ]);

  return {
    products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProductById = async (productId) => {
  return await product.findOne({ _id: productId }).lean();
};

const findProduct = async ({ product_id, unSelect }) => {
  return await product
    .findById(product_id)
    .select(unGetSelectData(unSelect))
    .lean();
};

const updateProductById = async ({
  product_id,
  bodyUpdate,
  model,
  isNew = true,
}) => {
  return await model.findByIdAndUpdate(product_id, bodyUpdate, { new: isNew });
};

const checkProductByServer = async (products) => {
  return await Promise.all(
    products.map(async (product) => {
      const foundProduct = await getProductById(product.productId);
      if (!foundProduct) return null;
      return {
        price: foundProduct.product_price,
        quantity: product.quantity,
        productId: product.productId,
      };
    }),
  ).then((results) => results.filter((p) => p !== null));
};

module.exports = {
  findAllDraftsForShop,
  publishProductByShop,
  findAllPublishForShop,
  unpublishProductByShop,
  searchProduct,
  findAllProducts,
  findAllProductsAdmin,
  findProduct,
  updateProductById,
  getProductById,
  checkProductByServer,
};

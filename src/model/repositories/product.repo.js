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
    .select("+isPublish")
    .populate("product_shop", "name email -_id")
    .sort({ updateAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

const countProduct = async (query) => {
  return await product.countDocuments(query).exec();
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
  limit = Number(limit) || 20;
  page = Number(page) || 1;
  const skip = (page - 1) * limit;
  const sortBy =
    sort === "price_asc"
      ? { product_price: 1 }
      : sort === "price_desc"
        ? { product_price: -1 }
        : sort === "oldest"
          ? { createdAt: 1 }
          : { createdAt: -1 };
  const query = { isDeleted: { $ne: true }, ...(filter || {}) };

  const [products, total] = await Promise.all([
    product
      .find(query)
      .select("+isPublish")
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .select(select?.length ? getSelectData(select) : {})
      .lean(),
    product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findAllProductsAdmin = async ({ limit, sort, page, filter = {} }) => {
  limit = Number(limit) || 20;
  page = Number(page) || 1;
  const skip = (page - 1) * limit;
  const sortBy = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const query = { isDeleted: { $ne: true }, ...filter };

  if (query.product_shop) {
    query.product_shop = new Types.ObjectId(query.product_shop);
  }

  const [products, total] = await Promise.all([
    product
      .find(query)
      .select("+isPublish")
      .populate("product_shop", "name email")
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    product.countDocuments(query),
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
    .findOne({ _id: new Types.ObjectId(product_id), isDeleted: { $ne: true } })
    .select(unGetSelectData(unSelect))
    .lean();
};

const updateProductById = async ({
  product_id,
  bodyUpdate,
  model,
  product_shop,
  isNew = true,
}) => {
  const query = {
    _id: new Types.ObjectId(product_id),
    isDeleted: { $ne: true },
  };

  if (product_shop) {
    query.product_shop = new Types.ObjectId(product_shop);
  }

  return await model
    .findOneAndUpdate(
      query,
      { $set: bodyUpdate },
      { new: isNew, runValidators: true },
    )
    .select("+isPublish")
    .lean();
};

const checkProductByServer = async (products) => {
  return await Promise.all(
    products.map(async (item) => {
      const foundProduct = await getProductById(item.productId);
      if (!foundProduct) return null;
      if (foundProduct.product_quantity < Number(item.quantity || 0)) return null;
      return {
        price: foundProduct.product_price,
        quantity: Number(item.quantity || 0),
        productId: item.productId,
        name: foundProduct.product_name,
        product_name: foundProduct.product_name,
        product_thumb: foundProduct.product_thumb,
        product_type: foundProduct.product_type,
        shopId: foundProduct.product_shop,
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

"use strict";

const { Types } = require("mongoose");
const {
  electronic,
  furniture,
  clothing,
  product,
} = require("../../model/product.model");
const { getSelectData, unGetSelectData } = require("../../utils");
const { parsePagination, buildPagination } = require("../../utils/pagination");

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
    pagination: buildPagination({
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
    }),
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

const suggestProducts = async ({ search = "", limit = 8 }) => {
  const keyword = String(search || "").trim();
  const perPage = Math.min(Math.max(Number(limit) || 8, 1), 12);

  if (!keyword) return [];

  return product
    .find({
      isDeleted: { $ne: true },
      isPublish: true,
      $or: [
        { product_name: { $regex: keyword, $options: "i" } },
        { product_type: { $regex: keyword, $options: "i" } },
      ],
    })
    .select({
      product_name: 1,
      product_thumb: 1,
      product_price: 1,
      product_type: 1,
      product_quantity: 1,
    })
    .sort({ product_sold: -1, product_ratingAverage: -1, createdAt: -1 })
    .limit(perPage)
    .lean();
};

const findInventoryAlerts = async ({ shopId, threshold = 5 }) => {
  const stockThreshold = Math.max(Number(threshold) || 5, 0);
  const query = {
    isDeleted: { $ne: true },
    product_shop: new Types.ObjectId(shopId),
  };
  const projection = {
    product_name: 1,
    product_thumb: 1,
    product_price: 1,
    product_quantity: 1,
    product_type: 1,
    isPublish: 1,
    isDraft: 1,
    updatedAt: 1,
  };

  const [lowStock, outOfStock] = await Promise.all([
    product
      .find({
        ...query,
        product_quantity: { $gt: 0, $lte: stockThreshold },
      })
      .select(projection)
      .sort({ product_quantity: 1, updatedAt: -1 })
      .limit(12)
      .lean(),
    product
      .find({
        ...query,
        product_quantity: { $lte: 0 },
      })
      .select(projection)
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean(),
  ]);

  return {
    lowStock,
    outOfStock,
    totalLowStock: await product.countDocuments({
      ...query,
      product_quantity: { $gt: 0, $lte: stockThreshold },
    }),
    totalOutOfStock: await product.countDocuments({
      ...query,
      product_quantity: { $lte: 0 },
    }),
    threshold: stockThreshold,
  };
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
    pagination: buildPagination({
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
    }),
  };
};

const findAllProducts = async ({ limit, sort, page, filter, select }) => {
  const pagination = parsePagination({ page, limit, defaultLimit: 20, maxLimit: 100 });
  const sortBy =
    sort === "price_asc"
      ? { product_price: 1 }
      : sort === "price_desc"
        ? { product_price: -1 }
        : sort === "rating"
          ? { product_ratingAverage: -1, product_reviewCount: -1, createdAt: -1 }
          : sort === "name_asc"
            ? { product_name: 1 }
            : sort === "name_desc"
              ? { product_name: -1 }
        : sort === "oldest"
          ? { createdAt: 1 }
          : { createdAt: -1 };
  const query = { isDeleted: { $ne: true }, ...(filter || {}) };

  const [products, total] = await Promise.all([
    product
      .find(query)
      .select("+isPublish")
      .sort(sortBy)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .select(select?.length ? getSelectData(select) : {})
      .lean(),
    product.countDocuments(query),
  ]);

  return {
    products,
    pagination: buildPagination({ ...pagination, total }),
  };
};

const publicProductFields = {
  product_name: 1,
  product_thumb: 1,
  product_images: 1,
  product_descriptions: 1,
  product_price: 1,
  product_quantity: 1,
  product_type: 1,
  product_shop: 1,
  product_attributes: 1,
  product_ratingAverage: 1,
  product_reviewCount: 1,
  product_sold: 1,
  product_isFeatured: 1,
  createdAt: 1,
  updatedAt: 1,
};

const findFeaturedProducts = async ({ limit = 5, excludeIds = [] } = {}) => {
  const perPage = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const excluded = excludeIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  return product.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        isPublish: true,
        product_quantity: { $gt: 0 },
        ...(excluded.length ? { _id: { $nin: excluded } } : {}),
      },
    },
    {
      $addFields: {
        home_featured_score: {
          $add: [
            { $cond: ["$product_isFeatured", 500, 0] },
            { $cond: [{ $gt: ["$product_quantity", 0] }, 300, 0] },
            { $min: [{ $ifNull: ["$product_reviewCount", 0] }, 50] },
            { $multiply: [{ $min: [{ $ifNull: ["$product_sold", 0] }, 100] }, 0.5] },
          ],
        },
      },
    },
    { $sort: { home_featured_score: -1, createdAt: -1 } },
    { $limit: perPage },
    { $project: { ...publicProductFields, home_featured_score: 1 } },
  ]);
};

const findCustomerFavoriteProducts = async ({ limit = 5, excludeIds = [] } = {}) => {
  const perPage = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const excluded = excludeIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  return product.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        isPublish: true,
        product_quantity: { $gt: 0 },
        ...(excluded.length ? { _id: { $nin: excluded } } : {}),
      },
    },
    {
      $addFields: {
        home_favorite_score: {
          $add: [
            { $multiply: [{ $ifNull: ["$product_ratingAverage", 0] }, 100] },
            { $multiply: [{ $min: [{ $ifNull: ["$product_reviewCount", 0] }, 200] }, 3] },
            { $multiply: [{ $min: [{ $ifNull: ["$product_sold", 0] }, 500] }, 1.5] },
          ],
        },
      },
    },
    { $sort: { home_favorite_score: -1, product_ratingAverage: -1, product_reviewCount: -1 } },
    { $limit: perPage },
    { $project: { ...publicProductFields, home_favorite_score: 1 } },
  ]);
};

const findAllProductsAdmin = async ({ limit, sort, page, filter = {} }) => {
  const pagination = parsePagination({ page, limit, defaultLimit: 20, maxLimit: 100 });
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
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    product.countDocuments(query),
  ]);

  return {
    products,
    pagination: buildPagination({ ...pagination, total }),
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
  suggestProducts,
  findInventoryAlerts,
  findAllProducts,
  findFeaturedProducts,
  findCustomerFavoriteProducts,
  findAllProductsAdmin,
  findProduct,
  updateProductById,
  getProductById,
  checkProductByServer,
};

"use strict";

const { Types } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const {
  product,
  clothing,
  electronic,
  furniture,
} = require("../model/product.model");
const { insertInventory } = require("../model/repositories/inventory.repo");
const {
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
} = require("../model/repositories/product.repo");
const { removeUndefinedObject, updateNestedObject } = require("../utils");
const NotificationService = require("./notification.service");

// define Factory class to create product
class ProductFactoryV2 {
  /*
	type: "Clothing",
	payload
  */

  static productRegistry = {};

  static registerProductType(type, classRef) {
    ProductFactoryV2.productRegistry[type] = classRef;
  }

  static async createProduct(type, payload) {
    const productClass = ProductFactoryV2.productRegistry[type];

    if (!productClass) throw new BadRequestError("Invalid product type ", type);

    return new productClass(payload).createProduct();
  }

  static async updateProduct(type, productId, payload) {
    if (type && !ProductFactoryV2.productRegistry[type]) {
      throw new BadRequestError("Invalid product type ", type);
    }

    const product_shop = payload.product_shop;
    const objectParam = removeUndefinedObject({ ...payload });
    delete objectParam.product_shop;

    const updatedProduct = await updateProductById({
      product_id: productId,
      bodyUpdate: updateNestedObject(objectParam),
      model: product,
      product_shop,
    });

    if (!updatedProduct) throw new NotFoundError("Product not found or unauthorized!");

    return updatedProduct;
  }

  static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isDraft: true };
    return await findAllDraftsForShop({ query, limit, skip });
  }

  ///PUT
  static async publishProductByShop({ product_shop, product_id }) {
    return await publishProductByShop({ product_shop, product_id });
  }

  static async unpublishProductByShop({ product_shop, product_id }) {
    return await unpublishProductByShop({ product_shop, product_id });
  }

  static async findAllPublishForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isPublish: true };
    return await findAllPublishForShop({ query, limit, skip });
  }

  static async searchProduct({ keySearch }) {
    return await searchProduct({ keySearch });
  }

  static async suggestProducts({ search, limit }) {
    return {
      suggestions: await suggestProducts({ search, limit }),
    };
  }

  static async getInventoryAlerts({ shopId, threshold }) {
    return await findInventoryAlerts({ shopId, threshold });
  }

  static async findAllProducts({
    limit = 50,
    sort = "ctime",
    page = 1,
    product_type,
    minPrice,
    maxPrice,
    search,
    stockStatus,
    filter = {},
    isPublic = false,
    product_shop,
    select = [],
  }) {
    const query = { ...filter };
    if (isPublic) query.isPublish = true;
    if (product_type) query.product_type = product_type;
    if (minPrice || maxPrice) {
      query.product_price = {};
      if (minPrice) query.product_price.$gte = Number(minPrice);
      if (maxPrice) query.product_price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: "i" } },
        { product_descriptions: { $regex: search, $options: "i" } },
      ];
    }

    if (isPublic) {
      return await findAllProducts({
        limit,
        sort,
        page,
        filter: query,
        select,
      });
    }
    return await findAllProductsAdmin({
      limit,
      sort,
      page,
      filter: {
        ...(product_shop ? { product_shop } : {}),
        ...(product_type ? { product_type } : {}),
        ...(search
          ? {
              $or: [
                { product_name: { $regex: search, $options: "i" } },
                { product_descriptions: { $regex: search, $options: "i" } },
              ],
            }
          : {}),
        ...(stockStatus === "low"
          ? { product_quantity: { $gt: 0, $lte: 5 } }
          : {}),
        ...(stockStatus === "out" ? { product_quantity: { $lte: 0 } } : {}),
      },
    });
  }

  static async findFeaturedProducts({ limit = 5 } = {}) {
    return {
      products: await findFeaturedProducts({ limit }),
      criteria: [
        "published only",
        "in stock",
        "shop featured signal",
        "review count",
        "sold count",
        "newest first fallback",
      ],
    };
  }

  static async findCustomerFavoriteProducts({ limit = 5, excludeIds = [] } = {}) {
    return {
      products: await findCustomerFavoriteProducts({ limit, excludeIds }),
      criteria: [
        "published only",
        "in stock",
        "rating average",
        "verified review count",
        "sold count",
      ],
    };
  }

  static async getHomeSections({ limit = 5 } = {}) {
    const perSectionLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
    const featured = await ProductFactoryV2.findFeaturedProducts({
      limit: perSectionLimit,
    });
    const customerFavorites = await ProductFactoryV2.findCustomerFavoriteProducts({
      limit: perSectionLimit,
      excludeIds: featured.products.map((item) => item._id),
    });

    return {
      featuredProducts: featured.products,
      customerFavorites: customerFavorites.products,
      criteria: {
        featuredProducts: featured.criteria,
        customerFavorites: customerFavorites.criteria,
      },
    };
  }

  static async findProduct({ product_id }) {
    const normalizedProductId = String(product_id || "").trim();

    if (!Types.ObjectId.isValid(normalizedProductId)) {
      throw new BadRequestError("Invalid product id", 400);
    }

    const foundProduct = await findProduct({
      product_id: normalizedProductId,
      unSelect: ["__v"],
    });

    if (!foundProduct) throw new NotFoundError("Product not found");

    return foundProduct;
  }

  static getAllProductTypes() {
    return Object.keys(ProductFactoryV2.productRegistry);
  }

  static async deleteProduct({ product_id, product_shop }) {
    const foundProduct = await product.findOne({
      _id: new Types.ObjectId(product_id),
      product_shop: new Types.ObjectId(product_shop),
      isDeleted: { $ne: true },
    });

    if (!foundProduct) throw new NotFoundError("Product not found or unauthorized!");

    await product.updateOne(
      { _id: new Types.ObjectId(product_id) },
      { $set: { isDeleted: true, isDraft: true, isPublish: false } },
    );
    return { message: "Product deleted successfully!" };
  }
}

// define base class product
class Product {
  constructor({
    product_name,
    product_thumb,
    product_descriptions,
    product_price,
    product_quantity,
    product_type,
    product_shop,
    product_attributes,
    product_images,
  }) {
    this.product_name = product_name;
    this.product_thumb = product_thumb;
    this.product_descriptions = product_descriptions;
    this.product_price = product_price;
    this.product_quantity = product_quantity;
    this.product_type = product_type;
    this.product_shop = product_shop;
    this.product_attributes = product_attributes;
    this.product_images = product_images || [];
  }

  //create new product
  async createProduct(product_id) {
    const newProduct = await product.create({ ...this, _id: product_id });

    if (newProduct) {
      // add product_ids in inventory collection
      await insertInventory({
        productId: newProduct._id,
        shopId: this.product_shop,
        stock: this.product_quantity,
      });

      // push notification to system collection
      NotificationService.createNotiSystem({
        type: "SHOP-001",
        receivedId: 1,
        senderId: this.product_shop,
        options: {
          product_name: this.product_name,
          shop_name: this.product_shop,
        },
      })
        .then((rs) => console.log(rs))
        .catch(console.error);
    }

    return newProduct;
  }

  // update product
  async updateProduct(product_id, bodyUpdate) {
    return await updateProductById({ product_id, bodyUpdate, model: product });
  }
}

// Define sub-Class for defferent product types Clothing
class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newClothing) throw new BadRequestError("create new Clothing error!!!");

    const newProduct = await super.createProduct();
    if (!newProduct) throw new BadRequestError("create new Product error!!!");

    return newProduct;
  }

  async updateProduct(productId) {
    /*
      1. remove attr has null or undefined
      2. what attr we will update
    */
    const objectParam = removeUndefinedObject(this);
    if (objectParam.product_attributes) {
      // update child
      await updateProductById({
        product_id: productId,
        bodyUpdate: updateNestedObject(objectParam.product_attributes),
        model: clothing,
      });
    }

    const updateProduct = await super.updateProduct(
      productId,
      updateNestedObject(objectParam),
    );
    return updateProduct;
  }
}

// Define sub-Class for defferent product types Electronic
class Electronic extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newElectronic)
      throw new BadRequestError("create new Electronic error!!!");

    const newProduct = await super.createProduct(newElectronic._id);
    if (!newProduct) throw new BadRequestError("create new Product error!!!");

    return newProduct;
  }
}

// Define sub-Class for defferent product types Electronic
class Furniture extends Product {
  async createProduct() {
    const newFurniture = await furniture.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newFurniture)
      throw new BadRequestError("create new Electronic error!!!");

    const newProduct = await super.createProduct(newFurniture._id);
    if (!newProduct) throw new BadRequestError("create new Product error!!!");

    return newProduct;
  }
}

//register product types
ProductFactoryV2.registerProductType("Electronics", Electronic);
ProductFactoryV2.registerProductType("Clothing", Clothing);
ProductFactoryV2.registerProductType("Furniture", Furniture);

module.exports = ProductFactoryV2;

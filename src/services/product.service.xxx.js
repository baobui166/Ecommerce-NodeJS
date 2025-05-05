"use strict"

const { BadRequestError } = require("../core/error.response")
const {
  product,
  clothing,
  electronic,
  furniture
} = require("../model/product.model")

// define Factory class to create product
class ProductFactory {
  /*
	type: "Clothing",
	payload
  */

  static productRegistry = {}

  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef
  }

  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type]

    if (!productClass) throw new BadRequestError("Invalid product type ", type)

    return new productClass(payload).createProduct()
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
    product_attributes
  }) {
    this.product_name = product_name
    this.product_thumb = product_thumb
    this.product_descriptions = product_descriptions
    this.product_price = product_price
    this.product_quantity = product_quantity
    this.product_type = product_type
    this.product_shop = product_shop
    this.product_attributes = product_attributes
  }

  //create new product
  async createProduct(product_id) {
    return await product.create({ ...this, _id: product_id })
  }
}

// Define sub-Class for defferent product types Clothing
class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create({
      ...this.product_attributes,
      product_shop: this.product_shop
    })
    if (!newClothing) throw new BadRequestError("create new Clothing error!!!")

    const newProduct = await super.createProduct()
    if (!newProduct) throw new BadRequestError("create new Product error!!!")

    return newProduct
  }
}

// Define sub-Class for defferent product types Electronic
class Electronic extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_shop: this.product_shop
    })
    if (!newElectronic)
      throw new BadRequestError("create new Electronic error!!!")

    const newProduct = await super.createProduct(newElectronic._id)
    if (!newProduct) throw new BadRequestError("create new Product error!!!")

    return newProduct
  }
}

// Define sub-Class for defferent product types Electronic
class Furniture extends Product {
  async createProduct() {
    const newFurniture = await furniture.create({
      ...this.product_attributes,
      product_shop: this.product_shop
    })
    if (!newFurniture)
      throw new BadRequestError("create new Electronic error!!!")

    const newProduct = await super.createProduct(newFurniture._id)
    if (!newProduct) throw new BadRequestError("create new Product error!!!")

    return newProduct
  }
}

//register product types
ProductFactory.registerProductType("Electronics", Electronic)
ProductFactory.registerProductType("Clothing", Clothing)
ProductFactory.registerProductType("Furniture", Furniture)

module.exports = ProductFactory

"use strict"

const { NotFoundError } = require("../core/error.response")
const cartModel = require("../model/cart.model")
const { getProductById } = require("../model/repositories/product.repo")

/**
 key feature: Cart Service
 - add product to cart [user]
 - reduce product quantity by one
 - increase product quantity by one
 - get cart [User]
 - Delete cart [User]
 - Delete cart item
 */

class CartService {
  ///START REPO CART///
  static async createUserCart({ userId, product }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateOrInsert = {
        $addToSet: { cart_products: product }
      },
      options = { upsert: true, new: true }

    return await cartModel.cart.findOneAndUpdate(query, updateOrInsert, options)
  }

  static async updateUserCartQuantity({ userId, product }) {
    const { productId, quantity } = product
    const query = {
        cart_userId: userId,
        "cart_products.productId": productId,
        cart_state: "active"
      },
      updateSet = {
        $inc: { "cart_products.$.quantity": quantity }
      },
      options = { upsert: true, new: true }

    return await cartModel.cart.findOneAndUpdate(query, updateSet, options)
  }
  ///END REPO CART///

  static async addToCart(userId, product = {}) {
    //check cart co ton tai hay khong
    const userCart = await cartModel.cart.findOne({ cart_userId: userId })
    if (!userCart) {
      return await CartService.createUserCart({ userId, product })
    }

    // neu co gio hang nhung chua co san pham
    if (!userCart.cart_products.length) {
      userCart.cart_products = [product]
      return await userCart.save()
    }

    // neu cos san pham do trong gio hang thi update quantity
    return CartService.updateUserCartQuantity({ userId, product })
  }

  // update cart

  /*
	shop_order_ids: [
  		{
  			shopId,
			itemProduct: [
  				{
  					quantity,
					price,
					shopId,
					old_quantity,
					productId			
				}			
			]
		}	
	]	
	*/
  static async addToCartV2({ userId, shop_order_ids }) {
    const { productId, quantity, old_quantity } =
      shop_order_ids[0]?.item_products[0]

    // check product
    const foundProduct = await getProductById(productId)
    if (!foundProduct)
      throw new NotFoundError("Product do not belong to the shop")
    // compare
    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId)
      throw new NotFoundError("Product do not belong to the shop")

    if (quantity === 0) {
      //deleted
    }

    return await CartService.updateUserCartQuantity({
      userId,
      product: {
        productId,
        quantity: Number(quantity) - Number(old_quantity)
      }
    })
  }

  static async deleteUserCart({ userId, productId }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateSet = { $pull: { cart_products: { productId } } }

    const deleteCart = await cartModel.cart.updateOne(query, updateSet)

    return deleteCart
  }

  static async getListUserCart({ userId }) {
    return await cartModel.cart.findOne({ cart_userId: +userId }).lean()
  }
}

module.exports = CartService

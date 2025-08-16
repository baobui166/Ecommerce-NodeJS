"use strict"

const { BadRequestError, NotFoundError } = require("../core/error.response")
const orderModel = require("../model/order.model")
const { findCartById } = require("../model/repositories/cart.repo")
const { checkProductByServer } = require("../model/repositories/product.repo")
const { getDiscountAmount } = require("./discount.service")
const { acquireLock, releaseLock } = require("./redis.service")

class CheckoutService {
  /*
	  {
		  cardId,
		  userId,
		  shop_order_ids: [
			  {
				  shopId,
				  shop_discounts: [
					  {
						  shopId,
						  discountId,
						  codeId
					  }
				  ],
				  item_produts: [
					  {
						  price,
						  quantity,
						  productId
					  },
					  {
						  price,
						  quantity,
						  productId
					  }
				  ]
			  }
		  ]
	  }
	  */
  static async checkoutReview({ cartId, userId, shop_order_ids }) {
    // check cartId ton tai khong
    const foundCart = await findCartById(cartId)
    if (!foundCart) throw new BadRequestError("Cart does not exists!")

    const checkout_order = {
        totalPrice: 0, // tong tien hang
        feeShip: 0, // phi ship
        totalDiscount: 0,
        totalCheckout: 0 // tong thanh toan
      },
      shop_order_ids_new = []

    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        item_products = []
      } = shop_order_ids[0]

      // check product available
      const checkProductServer = await checkProductByServer(item_products)
      if (!checkProductServer[0]) throw new BadRequestError("Order wrong!!!")

      // tong tien don hang
      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.quantity * product.price
      }, 0)

      // tong tien khi xu ly
      checkout_order.totalPrice += checkoutPrice

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice, // tien trc khi giam gias
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductServer
      }

      // neu shop_discount co ton tai > 0 thi check xem, co hop le hay khong
      if (shop_discounts.length > 0) {
        // gia su co 1 discount
        // check discount
        const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
          codeId: shop_discounts[0].codeId,
          userId,
          shopId,
          products: checkProductServer
        })
        // tong cong discount giam gia
        checkout_order.totalDiscount += discount

        // neu so tien giam gia lon hon 0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount
        }
      }

      // thanh toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount
      shop_order_ids_new.push(itemCheckout)
    }

    return { shop_order_ids, shop_order_ids_new, checkout_order }
  }

  // order
  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address = {},
    user_payment = {}
  }) {
    const { shop_order_ids_new, checkout_order } =
      await CheckoutService.checkoutReview({
        cartId,
        userId,
        shop_order_ids: shop_order_ids
      })

    // check lai 1 lan nua xem co vuot kho hay khong
    // get new array
    const products = shop_order_ids_new.flatMap((order) => order.item_products)
    const acquireProduct = []
    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i]
      const keyLock = await acquireLock(productId, quantity, cartId)
      acquireProduct.push(keyLock ? true : false)
      if (keyLock) {
        await releaseLock(keyLock)
      }
    }

    // check neu co 1 san pham het han trong kho thi sao
    if (acquireProduct.includes(false)) {
      throw new BadRequestError(
        "Mot so san pham da duoc cap nhat, vui long quay lai gio hang"
      )
    }

    const newOrder = await orderModel.create({
      order_userId: userId,
      order_checkout: checkout_order,
      order_shipping: user_address,
      order_payment: user_payment,
      order_products: shop_order_ids_new
    })

    // truong hop: neu thanh cong, thi remove product co trong gio hang
    if (newOrder) {
      // remove product co trong gio hang
    }
    return newOrder
  }
}

module.exports = CheckoutService

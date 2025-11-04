"use strict";

const notificationModel = require("../model/notification.model");

class NotificationService {
  static async createNotiSystem({
    type = "SHOP-001",
    receivedId = 1,
    senderId = 2,
    options = {},
  }) {
    let noti_content;
    if (type === "SHOP-001") {
      noti_content = `@@@ vừa mới thêm 1 sản phẩm: @@@@`;
    } else if (type === "PROMOTION-002") {
      noti_content = `@@@ vừa mới thêm 1 mã giảm giá: @@@@`;
    }

    const newNoti = await notificationModel.create({
      noti_type: type,
      noti_content,
      noti_senderId: senderId,
      noti_recivedId: receivedId,
      noti_options: options,
    });

    return newNoti;
  }

  static async listNotiByUser({ userId = 1, type = "ALL", isRead = 0 }) {
    const match = { noti_recivedId: userId };

    if (type !== "ALL") {
      match["noti_type"] = type;
    }

    return await notificationModel.aggregate([
      { $match: match },
      {
        $project: {
          noti_type: 1,
          noti_senderId: 1,
          noti_recivedId: 1,
          noti_content: {
            $concat: [
              { $substr: ["$noti_options,shop_name", 0, -1] },
              " just added a new product",
              { $substr: ["$noti_options.product_name", 0, -1] },
            ],
          },
          createAt: 1,
          noti_options: 1,
        },
      },
    ]);
  }
}

module.exports = NotificationService;

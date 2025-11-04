"use strict";

const { SuccessResponse } = require("../core/success.response");
const NotificationService = require("../services/notification.service");

class notificationController {
  listNotiByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Get noti by user successfully!",
      metadata: await NotificationService.listNotiByUser(req.body),
    }).send(res);
  };
}

module.exports = new notificationController();

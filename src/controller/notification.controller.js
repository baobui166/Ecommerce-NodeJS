"use strict";

const { SuccessResponse } = require("../core/success.response");
const NotificationService = require("../services/notification.service");

class notificationController {
  listNotiByUser = async (req, res, next) => {
    new SuccessResponse({
      message: "Get noti by user successfully!",
      metadata: await NotificationService.listNotiByUser({
        ...req.query,
        user: req.user,
      }),
    }).send(res);
  };

  markAsRead = async (req, res, next) => {
    new SuccessResponse({
      message: "Notification marked as read!",
      metadata: await NotificationService.markAsRead({
        user: req.user,
        notificationId: req.params.id,
      }),
    }).send(res);
  };

  markAllAsRead = async (req, res, next) => {
    new SuccessResponse({
      message: "Notifications marked as read!",
      metadata: await NotificationService.markAllAsRead({
        user: req.user,
      }),
    }).send(res);
  };

  deleteNotification = async (req, res, next) => {
    new SuccessResponse({
      message: "Notification deleted!",
      metadata: await NotificationService.deleteNotification({
        user: req.user,
        notificationId: req.params.id,
      }),
    }).send(res);
  };
}

module.exports = new notificationController();

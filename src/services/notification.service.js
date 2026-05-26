"use strict";

const { Types } = require("mongoose");
const { BadRequestError, ForbiddenError } = require("../core/error.response");
const notificationModel = require("../model/notification.model");
const {
  parsePagination,
  buildPagination,
  buildCursorPagination,
} = require("../utils/pagination");

const normalizeType = (type = "system") => {
  const value = String(type).toLowerCase();
  if (value.includes("order")) return "order";
  if (value.includes("promo")) return "promotion";
  if (value.includes("inventory")) return "inventory";
  if (value.includes("payment")) return "payment";
  return "system";
};

const mapNotification = (notification) => {
  const type = normalizeType(notification.type || notification.noti_type);
  const options = notification.noti_options || {};

  return {
    _id: notification._id?.toString(),
    recipientType: notification.recipientType || "user",
    recipientId: notification.recipientId?.toString() || null,
    type,
    title:
      notification.title ||
      options.title ||
      (type === "order" ? "Order update" : "Notification"),
    message:
      notification.message ||
      notification.noti_content ||
      options.message ||
      "",
    link: notification.link || options.link || "",
    data: notification.data || options,
    isRead: Boolean(notification.isRead),
    readAt: notification.readAt || null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

const isAdminUser = (user = {}) => user.role === "admin" || user.type === "shop";

const getRecipientFilter = (user = {}) => {
  if (isAdminUser(user)) {
    return { recipientType: "admin" };
  }

  if (!user.userId || !Types.ObjectId.isValid(user.userId)) {
    throw new ForbiddenError("Notification access denied");
  }

  return {
    recipientType: "user",
    recipientId: new Types.ObjectId(user.userId),
  };
};

class NotificationService {
  static async createNotification({
    recipientType = "user",
    recipientId = null,
    type = "system",
    title = "Notification",
    message = "",
    link = "",
    data = {},
  }) {
    const payload = {
      recipientType,
      recipientModel: recipientType === "admin" ? "Shop" : "User",
      type: normalizeType(type),
      title,
      message,
      link,
      data,
    };

    if (recipientId && Types.ObjectId.isValid(recipientId)) {
      payload.recipientId = new Types.ObjectId(recipientId);
    }

    return notificationModel.create(payload);
  }

  static async createNotiSystem({
    type = "SHOP-001",
    receivedId = 1,
    senderId = 2,
    options = {},
  }) {
    const payload = {
      noti_type: type,
      noti_content: options.message || "System notification",
      noti_recivedId: receivedId,
      noti_options: options,
      recipientType: "admin",
      type: normalizeType(type),
      title: options.title || "System notification",
      message: options.message || "System notification",
      data: options,
    };

    if (senderId && Types.ObjectId.isValid(senderId)) {
      payload.noti_senderId = new Types.ObjectId(senderId);
    }

    return notificationModel.create(payload);
  }

  static async listNotiByUser({
    user,
    type = "ALL",
    page = 1,
    limit = 20,
    cursor,
  }) {
    const filter = getRecipientFilter(user);

    if (type && type !== "ALL") {
      filter.type = normalizeType(type);
    }

    const pagination = parsePagination({ page, limit, defaultLimit: 20, maxLimit: 100 });
    const sort = { createdAt: -1, _id: -1 };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestError("Invalid notification cursor");
      }

      const cursorQuery = {
        ...filter,
        createdAt: { $lt: cursorDate },
      };

      const notifications = await notificationModel
        .find(cursorQuery)
        .sort(sort)
        .limit(pagination.limit + 1)
        .lean();

      const result = buildCursorPagination({
        items: notifications,
        limit: pagination.limit,
        getCursor: (item) => item.createdAt?.toISOString?.() || item.createdAt,
      });

      return {
        notifications: result.items.map(mapNotification),
        pagination: result.pagination,
      };
    }

    const [notifications, total] = await Promise.all([
      notificationModel
        .find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      notificationModel.countDocuments(filter),
    ]);

    const nextCursor =
      notifications.length === pagination.limit &&
      pagination.page < Math.ceil(total / pagination.limit)
        ? notifications[notifications.length - 1]?.createdAt?.toISOString?.() ||
          notifications[notifications.length - 1]?.createdAt
        : null;

    return {
      notifications: notifications.map(mapNotification),
      pagination: {
        ...buildPagination({ ...pagination, total }),
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    };
  }

  static async markAsRead({ user, notificationId }) {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestError("Invalid notification id");
    }

    const updated = await notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(notificationId), ...getRecipientFilter(user) },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true },
      )
      .lean();

    if (!updated) throw new BadRequestError("Notification not found");
    return mapNotification(updated);
  }

  static async markAllAsRead({ user }) {
    const filter = { ...getRecipientFilter(user), isRead: false };
    await notificationModel.updateMany(filter, {
      $set: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }

  static async deleteNotification({ user, notificationId }) {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestError("Invalid notification id");
    }

    const deleted = await notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      ...getRecipientFilter(user),
    });

    if (!deleted) throw new BadRequestError("Notification not found");
    return { success: true };
  }

  static mapNotification = mapNotification;
}

module.exports = NotificationService;

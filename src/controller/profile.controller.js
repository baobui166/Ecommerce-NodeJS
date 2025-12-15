"use strict";

const { SuccessResponse } = require("../core/success.response");

const dataProfiles = [
  { user_id: 1, user_name: "CR7", user_avatar: "image.com/user/1" },
  { user_id: 2, user_name: "M10", user_avatar: "image.com/user/2" },
  { user_id: 3, user_name: "G7", user_avatar: "image.com/user/3" },
];

class ProfileController {
  // admin
  profiles = async (req, res, next) => {
    new SuccessResponse({
      message: "View all profiles",
      metadata: dataProfiles,
    }).send(res);
  };

  // shop
  profile = async (req, res, next) => {
    new SuccessResponse({
      message: "View profile",
      metadata: {
        user_id: 1,
        user_name: "CR7",
        user_avatar: "image.com/user/1",
      },
    }).send(res);
  };
}

module.exports = new ProfileController();

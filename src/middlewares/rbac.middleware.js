"use strict";
const { AuthFailureError } = require("../core/error.response");
const { roleList } = require("../services/rbac.service");
const rbac = require("./role.middleware");

/**
 * @param {string} action // read, delete, update.
 * @param {*} resource // profile, balance, ....
 */
const grantAccess = (action, resource) => {
  return async (req, res, next) => {
    try {
      rbac.setGrants(await roleList({ userId: 999 }));
      const role_name = req.query.role;
      const permisson = rbac.can(role_name)[action](resource);

      if (!role_name) {
        throw new AuthFailureError("Role not found in request");
      }

      if (!permisson.granted) {
        throw new AuthFailureError("you dont have permission");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { grantAccess };

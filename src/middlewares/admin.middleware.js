"use strict";

const { ForbiddenError } = require("../core/error.response");

const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  const type = req.user?.type;

  if (role === "admin" || type === "shop") return next();

  throw new ForbiddenError("Admin permission required");
};

module.exports = { requireAdmin };

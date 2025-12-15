"use strict";

const { SuccessResponse } = require("../core/success.response");
const rbacService = require("../services/rbac.service");

class rbacController {
  /**
   * @description Create new role
   * @param {string} req
   * @param {*} res
   * @param {*} next
   */
  createRole = async (req, res, next) => {
    new SuccessResponse({
      message: "Created new role successfully!!!",
      metadata: await rbacService.createRole(req.body),
    }).send(res);
  };

  /**
   * @description Create new resource
   * @param {string} req
   * @param {*} res
   * @param {*} next
   */
  createResource = async (req, res, next) => {
    new SuccessResponse({
      message: "Created new resource successfully!!!",
      metadata: await rbacService.createResource(req.body),
    }).send(res);
  };

  /**
   * @description Get list roles
   * @param {string} req
   * @param {*} res
   * @param {*} next
   */
  getListRole = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list role successfully!!!",
      metadata: await rbacService.roleList(req.query),
    }).send(res);
  };

  /**
   * @description Get list resource
   * @param {string}
   * @param {*} res
   * @param {*} next
   */
  getListResource = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list resource successfully!!!",
      metadata: await rbacService.resourceList(req.query),
    }).send(res);
  };
}

module.exports = new rbacController();

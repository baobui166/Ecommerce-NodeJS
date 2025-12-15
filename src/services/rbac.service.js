"use strict";

const { BadRequestError } = require("../core/error.response");
const resourceModel = require("../model/resource.model");
const roleModel = require("../model/role.model");

class rbacService {
  static async createResource({ name, slug, description }) {
    try {
      // check name and slug exists
      const resource = await resourceModel.findOne({
        src_name: name,
        src_slug: slug,
      });

      if (resource) throw new BadRequestError("Resource exists!!!");

      // create resource
      const newResource = await resourceModel.create({
        src_name: name,
        src_slug: slug,
        src_description: description,
      });

      return newResource;
    } catch (error) {
      throw error;
    }
  }

  static async resourceList({
    userId = 0, // admin
    limit = 30,
    offset = 0,
    search = "",
  }) {
    try {
      // 1. check admin ? middleware function
      // 2. get list of resource

      const resources = await resourceModel.aggregate([
        {
          $project: {
            _id: 0,
            name: "$src_name",
            slug: "$src_slug",
            description: "$src_description",
            resourceId: "$_id",
            createdAt: 1,
          },
        },
      ]);

      return resources;
    } catch (error) {
      return [];
    }
  }

  static async createRole({
    name = "shop",
    slug = "1000",
    description = "extend from shop or user",
    grants = [],
  }) {
    try {
      // 1. check role exists
      //   const role = await roleModel.findOne({
      //     role_name: name,
      //     role_slug: slug,
      //   });

      //   if (role) throw new BadRequestError("Resource exists!!!");

      // 2.  create new role
      const newRole = await roleModel.create({
        role_name: name,
        role_slug: slug,
        role_description: description,
        role_grants: grants,
      });

      return newRole;
    } catch (error) {
      throw error;
    }
  }

  static async roleList({
    userId = 0, // admin
    limit = 30,
    offset = 0,
    search = "",
  }) {
    try {
      // 1. user must be admin
      // 2. list role

      //const roles = await roleModel.find();
      const roles = await roleModel.aggregate([
        {
          $unwind: "$role_grants",
        },
        {
          $lookup: {
            from: "Resources",
            localField: "role_grants.resource",
            foreignField: "_id",
            as: "resource",
          },
        },
        {
          $unwind: "$resource",
        },
        {
          $project: {
            role: "$role_name",
            resource: "$resource.src_name",
            action: "$role_grants.actions",
            attributes: "$role_grants.attributes",
          },
        },
        {
          $unwind: "$action",
        },
        {
          $project: {
            _id: 0,
            role: 1,
            resource: 1,
            action: "$action",
            attributes: 1,
          },
        },
      ]);

      return roles;
    } catch (error) {}
  }
}

module.exports = rbacService;

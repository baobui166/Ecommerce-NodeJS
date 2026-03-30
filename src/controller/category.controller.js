"use strict";

const { OK, CREATED } = require("../core/success.response");
const CategoryService = require("../services/category.service");

class CategoryController {
  /**
   * @des Create a new category
   * @route POST /v1/api/category
   */
  createCategory = async (req, res, next) => {
    new CREATED({
      message: "Category created successfully!",
      metadata: await CategoryService.createCategory(req.body),
    }).send(res);
  };

  /**
   * @des Get all categories
   * @route GET /v1/api/category
   */
  getAllCategories = async (req, res, next) => {
    new OK({
      message: "Categories retrieved successfully!",
      metadata: await CategoryService.getAllCategories(req.query),
    }).send(res);
  };

  /**
   * @des Get category by ID
   * @route GET /v1/api/category/:id
   */
  getCategoryById = async (req, res, next) => {
    new OK({
      message: "Category retrieved successfully!",
      metadata: await CategoryService.getCategoryById(req.params.id),
    }).send(res);
  };

  /**
   * @des Update a category
   * @route PATCH /v1/api/category/:id
   */
  updateCategory = async (req, res, next) => {
    new OK({
      message: "Category updated successfully!",
      metadata: await CategoryService.updateCategory(req.params.id, req.body),
    }).send(res);
  };

  /**
   * @des Soft delete a category
   * @route DELETE /v1/api/category/:id
   */
  deleteCategory = async (req, res, next) => {
    new OK({
      message: "Category deleted successfully!",
      metadata: await CategoryService.deleteCategory(req.params.id),
    }).send(res);
  };

  /**
   * @des Toggle category status
   * @route POST /v1/api/category/:id/toggle-status
   */
  toggleCategoryStatus = async (req, res, next) => {
    new OK({
      message: "Category status updated successfully!",
      metadata: await CategoryService.toggleCategoryStatus(req.params.id),
    }).send(res);
  };

  /**
   * @des Get category tree
   * @route GET /v1/api/category/tree
   */
  getCategoryTree = async (req, res, next) => {
    new OK({
      message: "Category tree retrieved successfully!",
      metadata: await CategoryService.getCategoryTree(),
    }).send(res);
  };
}

module.exports = new CategoryController();

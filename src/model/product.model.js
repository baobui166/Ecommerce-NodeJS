"use strict";

const { lowerCase } = require("lodash");
const { model, Schema } = require("mongoose"); // Erase if already required
const slugify = require("slugify");
const DOCUMENT_NAME = "Product";
const COLECTION_NAME = "Products";

// Declare the Schema of the Mongo model
var productSchema = new Schema(
  {
    product_name: {
      type: String,
      require: true,
    },
    product_thumb: {
      type: String,
      require: true,
    },
    product_images: {
      type: [String],
      default: [],
    },
    product_descriptions: {
      type: String,
    },
    product_slug: {
      type: String,
    },
    product_price: {
      type: Number,
      require: true,
    },
    product_quantity: {
      type: Number,
      require: true,
    },
    product_type: {
      type: String,
      require: true,
      enum: ["Electronics", "Clothing", "Furniture"],
    },
    product_shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    product_attributes: {
      type: Schema.Types.Mixed,
      require: true,
    },

    //more
    product_ratingAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be above 0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    product_reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    product_variations: { type: Array, default: [] },
    product_sold: { type: Number, default: 0 },
    product_isFeatured: { type: Boolean, default: false, index: true },
    isDraft: { type: Boolean, default: true, index: true, select: true },
    isPublish: { type: Boolean, default: false, index: true, select: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: COLECTION_NAME },
);

// document middleware: run before save() and create()....
productSchema.pre("save", function (next) {
  this.product_slug = slugify(this.product_name, { lower: true });
  next();
});

//create index for search
productSchema.index({ product_name: "text", product_descriptions: "text" });
productSchema.index({ isDeleted: 1, isPublish: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1, isPublish: 1, product_type: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1, product_shop: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1, product_shop: 1, product_quantity: 1 });

// define the product type = clothing
const clothingSchema = new Schema(
  {
    brand: { type: String, require: true },
    size: String,
    material: String,
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" },
  },
  {
    timestamps: true,
    collection: "clothes",
  },
);

// define the product type = electronic
const electronicSchema = new Schema(
  {
    manufacture: { type: String, require: true },
    model: String,
    color: String,
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" },
  },
  {
    timestamps: true,
    collection: "electronics",
  },
);

const furnitureSchema = new Schema(
  {
    manufacture: { type: String, require: true },
    model: String,
    color: String,
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" },
  },
  {
    timestamps: true,
    collection: "furnitures",
  },
);

//Export the model
module.exports = {
  product: model(DOCUMENT_NAME, productSchema),
  clothing: model("Clothing", clothingSchema),
  electronic: model("Electronics", electronicSchema),
  furniture: model("Furniture", furnitureSchema),
};

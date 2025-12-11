" use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Resource";
const COLLECTION_NAME = "Resources";

const resourceSchema = new Schema(
  {
    src_name: { type: String, reuquired: true }, // profile
    src_slug: { type: String, reuquired: true }, // 00001
    src_description: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, resourceSchema);

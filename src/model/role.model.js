" use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Resource";
const COLLECTION_NAME = "Resources";

// exmaple grant
// grantsList

// const grants = [
//   {
//     role: "admin",
//     resource: "profile",
//     actions: "update:any",
//     attributes: "*",
//   },
//   {
//     role: "admin",
//     resource: "profile",
//     actions: "update:any",
//     attributes: "*, !mount",
//   },
// ];

const roleSchema = new Schema(
  {
    role_name: {
      type: String,
      enum: ["user", "shop", "admin"],
      default: "user",
    },
    role_slug: { type: String, required: true },
    role_status: {
      type: String,
      default: "active",
      enum: ["active", "block", "pending"],
    },
    role_grants: [
      {
        resrource: {
          type: Schema.Types.ObjectId,
          ref: "Resource",
          required: true,
        },
        actions: [{ type: String, required: true }],
        attributes: [{ type: String, default: "*" }],
      },
    ],
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, roleSchema);

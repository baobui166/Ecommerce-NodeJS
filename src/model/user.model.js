"use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "User";
const COLLECTION_NAME = "Users";

const userSchema = new Schema(
  {
    user_slug: { type: String, required: true },
    user_name: { type: String, default: "" },
    user_password: { type: String, default: "" },
    user_salf: { type: String, default: "" },
    user_email: { type: String, required: true },
    user_googleId: { type: String, index: true },
    user_authProviders: {
      type: [String],
      enum: ["local", "google"],
      default: ["local"],
    },
    user_emailVerified: { type: Boolean, default: false },
    user_phone: { type: String, default: "" },
    user_sex: { type: String, enum: ["Male", "Female"], default: "Male" },
    user_avatar: { type: String, default: "" },
    user_date_of_birth: { type: Date, default: null },
    user_role: { type: Schema.Types.ObjectId, ref: "Role" },
    user_status: {
      type: String,
      default: "active",
      enum: ["pending", "active", "blocked"],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

userSchema.index({ user_email: 1 }, { unique: true });
userSchema.index({ user_status: 1, createdAt: -1 });
userSchema.index(
  { user_googleId: 1 },
  { unique: true, partialFilterExpression: { user_googleId: { $exists: true } } },
);

module.exports = model(DOCUMENT_NAME, userSchema);

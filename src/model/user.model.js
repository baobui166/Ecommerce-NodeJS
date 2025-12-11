" use strict";

const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "User";
const COLLECTION_NAME = "Users";

const userSchema = new Schema(
  {
    user_id: { type: Number, required: true },
    user_slug: { type: String, required: true },
    user_name: { type: String, default: "" },
    user_password: { type: String, default: "" },
    user_salf: { type: String, default: "" },
    user_email: { type: String, require: true },
    user_phone: { type: Number, default: "" },
    user_sex: { type: String, enum: ["Male", "Female"], default: "Male" },
    user_avatar: { type: String, default: "" },
    user_date_of_birth: { type: Date, default: null },
    user_role: { type: Schema.Types.ObjectId, ref: "Role" },
    user_status: {
      type: String,
      default: "pending",
      enum: ["peding", "active", "block"],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, userSchema);

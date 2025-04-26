"use strict"

const { model, Schema } = require("mongoose") // Erase if already required
const DOCUMENT_NAME = "Shop"
const COLECTION_NAME = "Shops"

// Declare the Schema of the Mongo model
var shopSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxLength: 50
    },
    email: {
      type: String,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive"
    },
    verify: {
      type: Schema.Types.Boolean,
      default: false
    },
    roles: {
      type: Array,
      default: []
    }
  },
  { timestamps: true, collection: COLECTION_NAME }
)

//Export the model
module.exports = model(DOCUMENT_NAME, shopSchema)

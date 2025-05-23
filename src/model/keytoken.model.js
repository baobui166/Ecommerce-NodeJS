"use strict"

const { Schema, model } = require("mongoose") // Erase if already required
const DOCUMENT_NAME = "Key"
const COLECTION_NAME = "Keys"

// Declare the Schema of the Mongo model
var keyTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Shop"
    },
    publicKey: {
      type: String,
      required: true
    },
    privateKey: {
      type: String,
      required: true
    },
    refreshTokensUsed: {
      type: Array,
      default: []
    },
    refreshToken: {
      type: String,
      require: true
    }
  },
  {
    timestamps: true,
    collection: COLECTION_NAME
  }
)

//Export the model
module.exports = model(DOCUMENT_NAME, keyTokenSchema)

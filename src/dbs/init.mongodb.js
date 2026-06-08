"use strict";

const mongoose = require("mongoose");
const { countConnect } = require("../helpers/check.connect");
const myLogger = require("../loggers/myLogger.log");
const connectString = process.env.MONGODB_URI || "mongodb://localhost:27017/shopDev";

class Database {
  constructor() {
    this.connect();
  }
  // connect
  connect(type = "mongodb") {
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString, { maxPoolSize: 50 })
      .then(() =>
        myLogger.log("MongoDB connected", [
          "database",
          { requestId: "system" },
          { connections: countConnect() },
        ]),
      )
      .catch((err) =>
        myLogger.error("MongoDB connection failed", [
          "database",
          { requestId: "system" },
          { message: err.message },
        ]),
      );
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;

"use strict"

const mongoose = require("mongoose")
const { countConnect } = require("../helpers/check.connect")
const connectSrting = "mongodb://localhost:27017/shopDev"

console.log(connectSrting)

class Database {
  constructor() {
    this.connect()
  }
  // connect
  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true)
      mongoose.set("debug", { color: true })
    }

    mongoose
      .connect(connectSrting, { maxPoolSize: 50 })
      .then((_) => console.log("Connected MongoDb Success PRO", countConnect()))
      .catch((err) => console.log("Error Connect!!!"))
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
    }

    return Database.instance
  }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb

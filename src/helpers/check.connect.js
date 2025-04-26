"use strict"
const mongoose = require("mongoose")
const os = require("os")
const process = require("process")
const _SECONDS = 5000

// count connect
const countConnect = () => {
  const numConnection = mongoose.connections.length
  console.log("Number of connections: ", numConnection)
}

// check overload
const overLoad = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length
    const numCore = os.cpus().length
    const memoryUsage = process.memoryUsage().rss

    // console.log(`Active connection: ${numConnection}`)
    // console.log(`Memory Usage: ${memoryUsage / 1024 / 1024} MB`)

    // Example maximum number of connection based on number ofs cores
    const maxConnections = numCore * 5
    if (numConnection > maxConnections) {
      console.log("Connection overload detected!")
    }
  }, _SECONDS) // moniter every 5 seconds
}

module.exports = { countConnect, overLoad }

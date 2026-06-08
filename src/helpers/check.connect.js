"use strict";
const mongoose = require("mongoose");
const os = require("os");
const process = require("process");
const myLogger = require("../loggers/myLogger.log");
const _SECONDS = 5000;

// count connect
const countConnect = () => {
  return mongoose.connections.length;
};

// check overload
const overLoad = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCore = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    // console.log(`Active connection: ${numConnection}`)
    // console.log(`Memory Usage: ${memoryUsage / 1024 / 1024} MB`)

    // Example maximum number of connection based on number ofs cores
    const maxConnections = numCore * 5;
    if (numConnection > maxConnections) {
      myLogger.error("MongoDB connection overload detected", [
        "database",
        { requestId: "system" },
        { connections: numConnection, maxConnections, memoryUsage },
      ]);
    }
  }, _SECONDS); // moniter every 5 seconds
};

module.exports = { countConnect, overLoad };

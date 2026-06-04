"use strict";

const { getHealth, getReadiness } = require("../services/health.service");

class HealthController {
  health = async (req, res) => {
    res.status(200).json(getHealth());
  };

  ready = async (req, res) => {
    const readiness = await getReadiness();
    res.status(readiness.ready ? 200 : 503).json(readiness);
  };
}

module.exports = new HealthController();

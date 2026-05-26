"use strict";

const { SuccessResponse } = require("../core/success.response");
const AiProductAssistantService = require("../services/aiProductAssistant.service");

class AiController {
  productAssistant = async (req, res, next) => {
    new SuccessResponse({
      message: "AI product assistant response success",
      metadata: await AiProductAssistantService.chat({
        message: req.body.message,
        history: req.body.history,
      }),
    }).send(res);
  };
}

module.exports = new AiController();

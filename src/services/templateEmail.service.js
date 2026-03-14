"use strict";

const { findOne } = require("../model/shop.model");
const templateModel = require("../model/template.model");
const { htmlEmailToken } = require("../utils/tem.html");

const newTemplate = async ({ tem_name, tem_html, tem_id = 0 }) => {
  // 1. check if template exitst
  // 2. create new template
  const newTemp = await templateModel.create({
    tem_name, // unique
    tem_html: htmlEmailToken(),
    tem_id,
  });
  return newTemp;
};

const getTemplate = async ({ tem_name }) => {
  const template = await findOne({ tem_name });

  return template;
};

module.exports = { newTemplate, getTemplate };

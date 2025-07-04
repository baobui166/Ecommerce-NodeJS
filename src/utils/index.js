"use strict"

const _ = require("lodash")
const { Types } = require("mongoose")

const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields)
}

// [a,b] = {a:1, b:1}
const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]))
}

// [a,b] = {a:0, b:0}
const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]))
}

//remove undefined Object
const removeUndefinedObject = (obj) => {
  Object.keys(obj).forEach((k) => {
    if (obj[k] == null) {
      delete obj[k]
    }
  })

  return obj
}

/*
 const data = {
  a: {
    b: 1,
    c: 2
  },
  d: 3

  => {
  "a,b": 1,
  "a,c": 2,
  "d": 3
}
}
  
 */
const updateNestedObject = (obj) => {
  const final = {}

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    // Nếu obj không phải object hoặc là mảng hoặc null thì trả về rỗng
    return final
  }

  Object.keys(obj).forEach((k) => {
    const value = obj[k]

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Nếu value là object con, đệ quy xử lý
      const nested = updateNestedObject(value)
      Object.keys(nested).forEach((nestedKey) => {
        final[`${k}.${nestedKey}`] = nested[nestedKey]
      })
    } else {
      // Nếu value là giá trị nguyên thủy hoặc mảng, gán trực tiếp
      final[k] = value
    }
  })

  return final
}

const convertToObjectIdMongodb = (id) => Types.ObjectId(id)

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedObject,
  updateNestedObject,
  convertToObjectIdMongodb
}

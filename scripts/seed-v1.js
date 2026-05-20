"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const ApiKey = require("../src/model/apiKey.model");
const Shop = require("../src/model/shop.model");
const Role = require("../src/model/role.model");
const { product } = require("../src/model/product.model");
const { inventory } = require("../src/model/inventory.model");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/shopDev";

const products = [
  {
    product_name: "Wireless Headphones",
    product_thumb: "https://placehold.co/600x600?text=Headphones",
    product_descriptions: "Bluetooth headphones for everyday use.",
    product_price: 1290000,
    product_quantity: 25,
    product_type: "Electronics",
    product_attributes: { manufacture: "ShopDev", model: "HD-01", color: "Black" },
  },
  {
    product_name: "Cotton T-Shirt",
    product_thumb: "https://placehold.co/600x600?text=T-Shirt",
    product_descriptions: "Soft cotton basic t-shirt.",
    product_price: 199000,
    product_quantity: 80,
    product_type: "Clothing",
    product_attributes: { brand: "ShopDev", size: "M", material: "Cotton" },
  },
  {
    product_name: "Minimal Desk",
    product_thumb: "https://placehold.co/600x600?text=Desk",
    product_descriptions: "Compact work desk for home offices.",
    product_price: 2490000,
    product_quantity: 12,
    product_type: "Furniture",
    product_attributes: { manufacture: "ShopDev", model: "DK-01", color: "Oak" },
  },
];

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  const apiKey = process.env.SEED_API_KEY || "dev-api-key";
  await ApiKey.findOneAndUpdate(
    { key: apiKey },
    { key: apiKey, status: true, permissions: ["0000"] },
    { upsert: true, new: true },
  );

  await Role.findOneAndUpdate(
    { role_name: "admin" },
    { role_name: "admin", role_slug: "admin", role_description: "Admin role", role_grants: [] },
    { upsert: true, new: true },
  );
  await Role.findOneAndUpdate(
    { role_name: "user" },
    { role_name: "user", role_slug: "user", role_description: "Customer role", role_grants: [] },
    { upsert: true, new: true },
  );

  const password = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin123456", 10);
  const shop = await Shop.findOneAndUpdate(
    { email: process.env.SEED_ADMIN_EMAIL || "admin@example.com" },
    {
      name: process.env.SEED_ADMIN_NAME || "Admin Shop",
      email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
      password,
      status: "active",
      verify: true,
      roles: ["ADMIN", "SHOP"],
    },
    { upsert: true, new: true },
  );

  for (const item of products) {
    const saved = await product.findOneAndUpdate(
      { product_name: item.product_name },
      {
        ...item,
        product_shop: shop._id,
        isDraft: false,
        isPublish: true,
        isDeleted: false,
      },
      { upsert: true, new: true },
    );

    await inventory.findOneAndUpdate(
      { inventory_productId: saved._id },
      {
        inventory_productId: saved._id,
        inventory_shopId: shop._id,
        inventory_stock: item.product_quantity,
        inventory_location: "default",
      },
      { upsert: true, new: true },
    );
  }

  console.log("Seed complete");
  console.log(`API key: ${apiKey}`);
  console.log(`Admin: ${process.env.SEED_ADMIN_EMAIL || "admin@example.com"}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

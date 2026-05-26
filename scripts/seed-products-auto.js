"use strict";

require("dotenv").config();
const mongoose = require("mongoose");

const Shop = require("../src/model/shop.model");
const { product } = require("../src/model/product.model");
const { inventory } = require("../src/model/inventory.model");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/shopDev";
const DEFAULT_COUNT = 60;

const imageUrl = (label, index) =>
  `https://placehold.co/900x900/png?text=${encodeURIComponent(`${label} ${index}`)}`;

const pick = (items, index) => items[index % items.length];

const toPrice = (base, index, step = 100000) => base + (index % 7) * step;

const catalogs = {
  Electronics: {
    names: [
      "Wireless Headphones",
      "Bluetooth Speaker",
      "Smart Watch",
      "USB-C Hub",
      "Mechanical Keyboard",
      "Gaming Mouse",
      "Portable SSD",
      "Noise Cancelling Earbuds",
      "Laptop Stand",
      "Fast Charger",
    ],
    brands: ["Auralite", "Voltix", "Nexora", "SoundPeak", "KeyLab"],
    colors: ["Black", "White", "Graphite", "Blue", "Silver"],
    basePrice: 590000,
    step: 180000,
    attributes: (index, brand, color) => ({
      manufacture: brand,
      model: `EL-${String(index + 1).padStart(3, "0")}`,
      color,
      warranty: `${12 + (index % 3) * 6} months`,
      connectivity: pick(["Bluetooth", "USB-C", "Wireless", "Dual mode"], index),
    }),
  },
  Clothing: {
    names: [
      "Cotton T-Shirt",
      "Linen Shirt",
      "Classic Hoodie",
      "Slim Fit Jeans",
      "Oversized Sweatshirt",
      "Running Shorts",
      "Polo Shirt",
      "Denim Jacket",
      "Chino Pants",
      "Graphic Tee",
    ],
    brands: ["UrbanThread", "CottonBay", "Wearly", "North Loom", "DailyFit"],
    colors: ["White", "Black", "Navy", "Beige", "Olive"],
    basePrice: 190000,
    step: 90000,
    attributes: (index, brand, color) => ({
      brand,
      size: pick(["S", "M", "L", "XL"], index),
      material: pick(["Cotton", "Linen", "Denim", "Polyester blend"], index),
      color,
      fit: pick(["Regular", "Slim", "Oversized"], index),
    }),
  },
  Furniture: {
    names: [
      "Minimal Desk",
      "Lounge Chair",
      "Wooden Bookshelf",
      "Coffee Table",
      "Bedside Cabinet",
      "Dining Chair",
      "TV Console",
      "Office Chair",
      "Shoe Cabinet",
      "Storage Bench",
    ],
    brands: ["OakNest", "Roomly", "CasaForm", "Wood & Co", "NordSpace"],
    colors: ["Oak", "Walnut", "White", "Black", "Natural"],
    basePrice: 990000,
    step: 250000,
    attributes: (index, brand, color) => ({
      manufacture: brand,
      model: `FU-${String(index + 1).padStart(3, "0")}`,
      color,
      material: pick(["Oak wood", "MDF", "Metal frame", "Fabric"], index),
      room: pick(["Living room", "Bedroom", "Office", "Dining room"], index),
    }),
  },
};

const buildProducts = (count) => {
  const types = Object.keys(catalogs);
  return Array.from({ length: count }, (_, index) => {
    const type = types[index % types.length];
    const catalog = catalogs[type];
    const nameBase = pick(catalog.names, Math.floor(index / types.length));
    const brand = pick(catalog.brands, index);
    const color = pick(catalog.colors, index);
    const productIndex = index + 1;
    const price = toPrice(catalog.basePrice, index, catalog.step);
    const quantity = 8 + ((index * 7) % 80);
    const reviewCount = (index * 5) % 90;
    const rating = reviewCount > 0 ? Math.round((3.7 + (index % 13) / 10) * 10) / 10 : 0;

    return {
      product_name: `${brand} ${nameBase} ${productIndex}`,
      product_thumb: imageUrl(nameBase, productIndex),
      product_images: [
        imageUrl(`${nameBase} detail`, productIndex),
        imageUrl(`${nameBase} lifestyle`, productIndex),
        imageUrl(`${nameBase} package`, productIndex),
      ],
      product_descriptions:
        `${brand} ${nameBase} is a ready-to-sell sample product for the ecommerce catalog. ` +
        `It includes realistic pricing, stock, attributes, gallery images, and public status for UI testing.`,
      product_price: price,
      product_quantity: quantity,
      product_type: type,
      product_attributes: catalog.attributes(index, brand, color),
      product_ratingAverage: Math.min(rating, 5),
      product_reviewCount: reviewCount,
      product_sold: (index * 11) % 240,
      product_isFeatured: index % 9 === 0,
      isDraft: false,
      isPublish: true,
      isDeleted: false,
    };
  });
};

const findSeedShop = async () => {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const byEmail = await Shop.findOne({ email }).lean();
  if (byEmail) return byEmail;

  return Shop.findOne({ status: "active" }).sort({ createdAt: 1 }).lean();
};

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  const shop = await findSeedShop();
  if (!shop) {
    throw new Error("No shop found. Run `npm run seed:v1` first or set SEED_ADMIN_EMAIL.");
  }

  const count = Math.max(Number(process.env.SEED_PRODUCT_COUNT) || DEFAULT_COUNT, 1);
  const items = buildProducts(count);

  let createdOrUpdated = 0;
  for (const item of items) {
    const saved = await product.findOneAndUpdate(
      {
        product_name: item.product_name,
        product_shop: shop._id,
      },
      {
        ...item,
        product_shop: shop._id,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    await inventory.findOneAndUpdate(
      { inventory_productId: saved._id },
      {
        inventory_productId: saved._id,
        inventory_shopId: shop._id,
        inventory_stock: saved.product_quantity,
        inventory_location: "default",
      },
      { upsert: true, new: true },
    );

    createdOrUpdated += 1;
  }

  console.log(`Seeded ${createdOrUpdated} products for shop ${shop.email || shop._id}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

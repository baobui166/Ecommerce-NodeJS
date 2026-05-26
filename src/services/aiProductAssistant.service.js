"use strict";

const { BadRequestError } = require("../core/error.response");
const ProductService = require("./product.service.xxx");

const PRODUCT_TYPES = ["Electronics", "Clothing", "Furniture"];
const DEFAULT_MAX_PRODUCTS = 8;

const TYPE_KEYWORDS = [
  {
    type: "Electronics",
    keywords: [
      "electronics",
      "electronic",
      "phone",
      "laptop",
      "computer",
      "tablet",
      "headphone",
      "camera",
      "dien tu",
      "dien thoai",
      "may tinh",
      "tai nghe",
    ],
  },
  {
    type: "Clothing",
    keywords: [
      "clothing",
      "clothes",
      "shirt",
      "t-shirt",
      "jeans",
      "dress",
      "jacket",
      "ao",
      "quan",
      "vay",
      "thoi trang",
    ],
  },
  {
    type: "Furniture",
    keywords: [
      "furniture",
      "chair",
      "table",
      "desk",
      "sofa",
      "bed",
      "ghe",
      "ban",
      "tu",
      "giuong",
      "noi that",
    ],
  },
];

const KEYWORD_ALIASES = [
  "laptop",
  "phone",
  "camera",
  "headphone",
  "chair",
  "desk",
  "table",
  "sofa",
  "shirt",
  "jeans",
  "dress",
  "ao",
  "quan",
  "ghe",
  "ban",
  "dien thoai",
  "may tinh",
  "tai nghe",
];

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toNumber = (value) => {
  const parsed = Number(String(value || "").replace(/[,.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBudget = (text) => {
  const normalized = normalizeText(text);
  const match = normalized.match(
    /(duoi|under|below|less than|khoang|around|tam|toi da|max|tren|over|above)?\s*(\d+(?:[.,]\d+)?)\s*(trieu|million|m|k|nghin|ngan|vnd|d)?/,
  );

  if (!match) return {};

  const rawAmount = Number(String(match[2]).replace(",", "."));
  const unit = match[3] || "";
  const operator = match[1] || "";
  let amount = rawAmount;

  if (["trieu", "million", "m"].includes(unit)) amount *= 1000000;
  if (["k", "nghin", "ngan"].includes(unit)) amount *= 1000;
  if (!unit && amount < 1000) amount *= 1000000;

  const rounded = Math.round(amount);
  if (operator && /(tren|over|above)/.test(operator)) return { minPrice: rounded };
  return { maxPrice: rounded };
};

const parseType = (text) => {
  const normalized = normalizeText(text);
  const exactType = PRODUCT_TYPES.find((type) => normalized.includes(type.toLowerCase()));
  if (exactType) return exactType;

  return TYPE_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(normalizeText(keyword))),
  )?.type;
};

const parseSort = (text) => {
  const normalized = normalizeText(text);
  if (/(re hon|gia re|cheap|low price|budget)/.test(normalized)) return "price_asc";
  if (/(cao cap|dat|premium|expensive)/.test(normalized)) return "price_desc";
  if (/(danh gia|rating|favorite|yeu thich|tot nhat)/.test(normalized)) return "rating";
  if (/(ban chay|popular|sold|hot)/.test(normalized)) return "rating";
  return "ctime";
};

const parseSearch = (text, productType) => {
  const normalized = normalizeText(text);
  const alias = KEYWORD_ALIASES.find((keyword) => normalized.includes(normalizeText(keyword)));
  if (alias) return alias;

  const stopWords = new Set([
    "toi",
    "can",
    "muon",
    "mua",
    "tim",
    "san",
    "pham",
    "duoi",
    "tren",
    "khoang",
    "tam",
    "gia",
    "re",
    "tot",
    "cho",
    "with",
    "for",
    "need",
    "want",
    "buy",
    "find",
    "product",
    "products",
  ]);
  const words = normalized
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word) && Number.isNaN(toNumber(word)));

  const filtered = words.filter(
    (word) => !productType || !normalizeText(productType).includes(word),
  );

  return filtered.slice(0, 3).join(" ");
};

const parseIntent = (message) => {
  const product_type = parseType(message);
  const budget = parseBudget(message);
  const search = parseSearch(message, product_type);

  return {
    product_type,
    search,
    sort: parseSort(message),
    ...budget,
  };
};

const mapProductForAssistant = (product) => ({
  _id: String(product._id),
  product_name: product.product_name,
  product_thumb: product.product_thumb,
  product_price: Number(product.product_price || 0),
  product_quantity: Number(product.product_quantity || 0),
  product_type: product.product_type,
  product_ratingAverage: Number(product.product_ratingAverage || 0),
  product_reviewCount: Number(product.product_reviewCount || 0),
  product_sold: Number(product.product_sold || 0),
  product_descriptions: product.product_descriptions || "",
  reason:
    Number(product.product_quantity || 0) > 0
      ? "Matches your request and is currently available."
      : "Matches your request, but stock is currently limited.",
});

const buildFallbackReply = ({ products, intent }) => {
  if (!products.length) {
    return "I could not find a matching published product right now. Try a broader budget, another product type, or a simpler keyword.";
  }

  const typeText = intent.product_type ? ` in ${intent.product_type}` : "";
  const budgetText = intent.maxPrice ? ` within your budget` : "";
  return `I found ${products.length} product${products.length > 1 ? "s" : ""}${typeText}${budgetText}. These are real products from the current catalog.`;
};

const buildQuickReplies = ({ products, intent }) => {
  const replies = [];
  if (!intent.maxPrice) replies.push("Show cheaper options");
  replies.push("Best rated products");
  replies.push("Only in-stock products");
  if (products.some((product) => Number(product.product_quantity || 0) <= 0)) {
    replies.push("Hide out of stock");
  }
  return replies.slice(0, 4);
};

const isBroadDiscoveryMessage = (intent) =>
  !intent.product_type &&
  !intent.search &&
  !intent.minPrice &&
  !intent.maxPrice &&
  intent.sort === "ctime";

const buildLlmMessages = ({ message, history, products, intent }) => [
  {
    role: "system",
    content:
      "You are an ecommerce product assistant. Reply in the user's language. Only recommend products from the provided JSON list. Never invent products, prices, discounts, stock, or specifications. If a product has product_quantity <= 0, do not say it is in stock. Keep the answer concise and helpful. Return strict JSON with keys: reply, productReasons, quickReplies. productReasons must map product _id to one short reason.",
  },
  ...history.slice(-6).map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    content: String(item.content || "").slice(0, 500),
  })),
  {
    role: "user",
    content: JSON.stringify({
      userMessage: message,
      parsedIntent: intent,
      products,
    }),
  },
];

const parseLlmJson = (content) => {
  if (!content) return null;
  const trimmed = String(content).trim();
  const jsonText = trimmed.match(/\{[\s\S]*\}/)?.[0] || trimmed;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
};

const callOpenAiCompatible = async ({ message, history, products, intent }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 12000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: buildLlmMessages({ message, history, products, intent }),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return parseLlmJson(data?.choices?.[0]?.message?.content);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

class AiProductAssistantService {
  static async chat({ message, history = [] }) {
    const normalizedMessage = String(message || "").trim();
    if (!normalizedMessage) {
      throw new BadRequestError("Message is required");
    }

    const maxProducts = Math.min(
      Math.max(Number(process.env.AI_MAX_PRODUCTS || DEFAULT_MAX_PRODUCTS), 1),
      12,
    );
    const intent = parseIntent(normalizedMessage);

    if (isBroadDiscoveryMessage(intent)) {
      return {
        reply:
          "I can help narrow it down. What product type are you looking for, and do you have a budget or main use case?",
        products: [],
        quickReplies: [
          "Furniture under 3M",
          "Best rated electronics",
          "Affordable clothing",
        ],
        intent,
        fallback: true,
      };
    }

    const productResponse = await ProductService.findAllProducts({
      isPublic: true,
      page: 1,
      limit: maxProducts,
      sort: intent.sort,
      product_type: intent.product_type,
      minPrice: intent.minPrice,
      maxPrice: intent.maxPrice,
      search: intent.search,
      select: [
        "product_name",
        "product_thumb",
        "product_descriptions",
        "product_price",
        "product_quantity",
        "product_type",
        "product_ratingAverage",
        "product_reviewCount",
        "product_sold",
      ],
    });

    let products = (productResponse.products || []).map(mapProductForAssistant);
    products = [...products].sort((a, b) => {
      const stockScore = Number(b.product_quantity > 0) - Number(a.product_quantity > 0);
      if (stockScore !== 0) return stockScore;
      return b.product_ratingAverage - a.product_ratingAverage;
    });

    const llmResult = await callOpenAiCompatible({
      message: normalizedMessage,
      history: Array.isArray(history) ? history : [],
      products,
      intent,
    });

    const reasons = llmResult?.productReasons || {};
    const enrichedProducts = products.map((product) => ({
      ...product,
      reason:
        typeof reasons[product._id] === "string" && reasons[product._id].trim()
          ? reasons[product._id].trim()
          : product.reason,
    }));

    return {
      reply:
        typeof llmResult?.reply === "string" && llmResult.reply.trim()
          ? llmResult.reply.trim()
          : buildFallbackReply({ products: enrichedProducts, intent }),
      products: enrichedProducts,
      quickReplies:
        Array.isArray(llmResult?.quickReplies) && llmResult.quickReplies.length
          ? llmResult.quickReplies.slice(0, 4).map(String)
          : buildQuickReplies({ products: enrichedProducts, intent }),
      intent,
      fallback: !llmResult,
    };
  }
}

module.exports = AiProductAssistantService;

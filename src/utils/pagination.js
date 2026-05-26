"use strict";

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePagination = ({
  page = 1,
  limit = 20,
  defaultLimit = 20,
  maxLimit = 100,
} = {}) => {
  const normalizedPage = toPositiveInt(page, 1);
  const requestedLimit = toPositiveInt(limit, defaultLimit);
  const normalizedLimit = Math.min(Math.max(requestedLimit, 1), maxLimit);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
};

const buildPagination = ({ page, limit, total }) => {
  const safeTotal = Math.max(Number(total) || 0, 0);
  const totalPages = Math.max(Math.ceil(safeTotal / limit), 1);

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const buildCursorPagination = ({ items, limit, getCursor }) => {
  const hasMore = items.length > limit;
  const slicedItems = hasMore ? items.slice(0, limit) : items;
  const lastItem = slicedItems[slicedItems.length - 1];

  return {
    items: slicedItems,
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore && lastItem ? getCursor(lastItem) : null,
    },
  };
};

module.exports = {
  parsePagination,
  buildPagination,
  buildCursorPagination,
};

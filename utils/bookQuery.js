const AppError = require('./AppError');

const allowedSortFields = new Set(['price', 'title', 'publishedYear']);
const maximumPageSize = 100;

function getSingleQueryValue(query, name) {
  const value = query[name];
  if (Array.isArray(value) || (value !== undefined && typeof value !== 'string')) {
    throw new AppError(`${name} must be provided once`, 400);
  }
  return value;
}

function parseNumber(query, name) {
  const value = getSingleQueryValue(query, name);
  if (value === undefined) return undefined;

  if (value.trim() === '') {
    throw new AppError(`${name} must be a valid number`, 400);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new AppError(`${name} must be a valid number`, 400);
  }
  return number;
}

function parsePositiveInteger(query, name, defaultValue, maximum) {
  const value = getSingleQueryValue(query, name);
  if (value === undefined) return defaultValue;

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || (maximum && number > maximum)) {
    const upperBound = maximum ? ` and no greater than ${maximum}` : '';
    throw new AppError(`${name} must be a positive integer${upperBound}`, 400);
  }
  return number;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildBookQuery(query) {
  const filter = {};
  const genre = getSingleQueryValue(query, 'genre');
  const author = getSingleQueryValue(query, 'author');
  const search = getSingleQueryValue(query, 'search');
  const minPrice = parseNumber(query, 'minPrice');
  const maxPrice = parseNumber(query, 'maxPrice');

  if (genre !== undefined) filter.genre = genre;
  if (author !== undefined) {
    if (!/^[0-9a-fA-F]{24}$/.test(author)) {
      throw new AppError('author must be a valid author id', 400);
    }
    filter.author = author;
  }
  if (search !== undefined) filter.title = { $regex: escapeRegex(search), $options: 'i' };
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new AppError('minPrice cannot be greater than maxPrice', 400);
    }
  }

  const sortField = getSingleQueryValue(query, 'sort');
  const order = getSingleQueryValue(query, 'order');
  const sort = {};
  if (sortField !== undefined) {
    if (!allowedSortFields.has(sortField)) {
      throw new AppError('sort must be price, title, or publishedYear', 400);
    }
    if (order !== undefined && !['asc', 'desc'].includes(order.toLowerCase())) {
      throw new AppError('order must be asc or desc', 400);
    }
    sort[sortField] = order && order.toLowerCase() === 'desc' ? -1 : 1;
    sort._id = 1;
  } else if (order !== undefined) {
    throw new AppError('order can only be used together with sort', 400);
  }

  const page = parsePositiveInteger(query, 'page', 1);
  const limit = parsePositiveInteger(query, 'limit', 20, maximumPageSize);

  return { filter, sort, page, limit };
}

module.exports = { buildBookQuery };

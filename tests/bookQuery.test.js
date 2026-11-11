const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBookQuery } = require('../utils/bookQuery');

test('builds a filter from only the provided parameters', () => {
  assert.deepEqual(buildBookQuery({ genre: 'Thriller' }), {
    filter: { genre: 'Thriller' },
    sort: {},
    page: 1,
    limit: 20
  });
  assert.deepEqual(buildBookQuery({ minPrice: '10', maxPrice: '30' }).filter, {
    price: { $gte: 10, $lte: 30 }
  });
});

test('combines filters, escaped case-insensitive search, sorting, and pagination', () => {
  const result = buildBookQuery({
    genre: 'Thriller',
    author: '0123456789abcdef01234567',
    search: 'sea.*',
    minPrice: '10',
    sort: 'price',
    order: 'desc',
    page: '2',
    limit: '5'
  });

  assert.deepEqual(result, {
    filter: {
      genre: 'Thriller',
      author: '0123456789abcdef01234567',
      title: { $regex: 'sea\\.\\*', $options: 'i' },
      price: { $gte: 10 }
    },
    sort: { price: -1, _id: 1 },
    page: 2,
    limit: 5
  });
});

test('rejects invalid filters and pagination values', () => {
  for (const query of [
    { minPrice: 'not-a-number' },
    { minPrice: '' },
    { minPrice: '20', maxPrice: '10' },
    { sort: 'author' },
    { sort: 'price', order: 'sideways' },
    { page: '0' },
    { limit: '101' },
    { author: 'not-an-id' }
  ]) {
    assert.throws(() => buildBookQuery(query), { statusCode: 400 });
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Book = require('../models/Book');

function createBook(overrides = {}) {
  return new Book({
    title: 'The Silent Sea',
    genre: 'Thriller',
    price: 24.99,
    publishedYear: 2021,
    author: new mongoose.Types.ObjectId(),
    ...overrides
  });
}

test('requires core book fields', () => {
  const error = new Book().validateSync();

  assert.ok(error.errors.title);
  assert.ok(error.errors.genre);
  assert.ok(error.errors.price);
  assert.ok(error.errors.publishedYear);
  assert.ok(error.errors.author);
});

test('accepts a valid book and rejects out-of-range business values', () => {
  assert.equal(createBook().validateSync(), undefined);

  for (const price of [0, -0.01]) {
    assert.ok(createBook({ price }).validateSync().errors.price);
  }

  for (const publishedYear of [1449, new Date().getFullYear() + 1]) {
    assert.ok(createBook({ publishedYear }).validateSync().errors.publishedYear);
  }
});

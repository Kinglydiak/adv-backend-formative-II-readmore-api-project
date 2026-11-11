const Author = require('../models/Author');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildBookQuery } = require('../utils/bookQuery');

const caseInsensitiveCollation = { locale: 'en', strength: 2 };
const bookFields = ['title', 'genre', 'price', 'publishedYear', 'author'];

function getBookFields(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object', 400);
  }
  return Object.fromEntries(
    bookFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]])
  );
}

function validateId(id) {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError('Book id must be a valid MongoDB id', 400);
  }
}

async function validateAuthor(authorId) {
  if (typeof authorId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(authorId)) {
    throw new AppError('author must be a valid author id', 400);
  }
  if (!(await Author.exists({ _id: authorId }))) {
    throw new AppError('The specified author does not exist', 400);
  }
}

async function ensureUniqueTitle(authorId, title, excludeBookId) {
  if (title === undefined) return;

  const duplicate = await Book.findOne({
    author: authorId,
    title,
    ...(excludeBookId ? { _id: { $ne: excludeBookId } } : {})
  }).collation(caseInsensitiveCollation);

  if (duplicate) {
    throw new AppError('This author already has a book with that title', 409);
  }
}

exports.createBook = asyncHandler(async (req, res) => {
  const fields = getBookFields(req.body);
  if (fields.author === undefined) {
    throw new AppError('An author id is required', 400);
  }
  await validateAuthor(fields.author);
  await ensureUniqueTitle(fields.author, fields.title);

  const book = await Book.create(fields);
  await book.populate('author');
  res.status(201).json(book);
});

exports.getBooks = asyncHandler(async (req, res) => {
  const { filter, sort, page, limit } = buildBookQuery(req.query);
  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate('author')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Book.countDocuments(filter)
  ]);

  res.json({ page, limit, total, results: books });
});

exports.getBook = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const book = await Book.findById(req.params.id).populate('author');
  if (!book) throw new AppError('Book not found', 404);
  res.json(book);
});

exports.updateBook = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  const updates = getBookFields(req.body);
  if (Object.keys(updates).length === 0) {
    throw new AppError('Provide at least one book field to update', 400);
  }

  const authorId = updates.author ?? book.author;
  if (updates.author !== undefined) await validateAuthor(authorId);
  await ensureUniqueTitle(authorId, updates.title ?? book.title, book._id);

  Object.assign(book, updates);
  await book.save();
  await book.populate('author');
  res.json(book);
});

exports.deleteBook = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  await book.deleteOne();
  res.json({ message: 'Book deleted successfully' });
});

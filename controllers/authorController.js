const Author = require('../models/Author');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authorFields = ['name', 'country', 'bio'];

function getAuthorFields(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object', 400);
  }
  return Object.fromEntries(
    authorFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]])
  );
}

function validateId(id) {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError('Author id must be a valid MongoDB id', 400);
  }
}

exports.createAuthor = asyncHandler(async (req, res) => {
  const author = await Author.create(getAuthorFields(req.body));
  res.status(201).json(author);
});

exports.getAuthors = asyncHandler(async (req, res) => {
  const authors = await Author.find().sort({ name: 1 });
  res.json(authors);
});

exports.getAuthor = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const author = await Author.findById(req.params.id);
  if (!author) throw new AppError('Author not found', 404);
  res.json(author);
});

exports.updateAuthor = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const updates = getAuthorFields(req.body);
  if (Object.keys(updates).length === 0) {
    throw new AppError('Provide at least one author field to update', 400);
  }

  const author = await Author.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });
  if (!author) throw new AppError('Author not found', 404);
  res.json(author);
});

exports.deleteAuthor = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const author = await Author.findById(req.params.id);
  if (!author) throw new AppError('Author not found', 404);

  // Blocking preserves book records and avoids silently cascading deletion.
  if (await Book.exists({ author: author._id })) {
    throw new AppError('Cannot delete an author who still has books', 409);
  }

  await author.deleteOne();
  res.json({ message: 'Author deleted successfully' });
});

exports.getAuthorBooks = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const author = await Author.findById(req.params.id);
  if (!author) throw new AppError('Author not found', 404);

  const books = await Book.find({ author: author._id }).populate('author');
  res.json(books);
});

exports.getAuthorStats = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const author = await Author.findById(req.params.id);
  if (!author) throw new AppError('Author not found', 404);

  const [stats] = await Book.aggregate([
    { $match: { author: author._id } },
    {
      $group: {
        _id: null,
        bookCount: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        cheapestBook: { $min: '$price' },
        mostExpensiveBook: { $max: '$price' }
      }
    }
  ]);

  if (!stats) {
    return res.json({
      author: author.name,
      bookCount: 0,
      averagePrice: 0,
      cheapestBook: null,
      mostExpensiveBook: null
    });
  }

  const [cheapest, mostExpensive] = await Promise.all([
    Book.findOne({ author: author._id, price: stats.cheapestBook }).select('title'),
    Book.findOne({ author: author._id, price: stats.mostExpensiveBook }).select('title')
  ]);

  res.json({
    author: author.name,
    bookCount: stats.bookCount,
    averagePrice: Math.round(stats.averagePrice * 100) / 100,
    cheapestBook: cheapest.title,
    mostExpensiveBook: mostExpensive.title
  });
});

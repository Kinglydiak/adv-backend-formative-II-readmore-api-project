const mongoose = require('mongoose');

const caseInsensitiveCollation = { locale: 'en', strength: 2 };

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true
    },
    genre: {
      type: String,
      required: [true, 'Book genre is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Book price is required'],
      validate: {
        validator: (price) => Number.isFinite(price) && price > 0,
        message: 'Price must be greater than zero'
      }
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
      validate: {
        validator: (year) =>
          Number.isInteger(year) && year >= 1450 && year <= new Date().getFullYear(),
        message: `Published year must be between 1450 and ${new Date().getFullYear()}`
      }
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'An author is required']
    }
  },
  { timestamps: true }
);

bookSchema.index(
  { author: 1, title: 1 },
  { unique: true, collation: caseInsensitiveCollation }
);

module.exports = mongoose.model('Book', bookSchema);

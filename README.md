# ReadMore API

A bookstore REST API built with Express, MongoDB, and Mongoose. It manages authors and books, links each book to an author, and enforces bookstore business rules.

# Video Walkthrough link 
https://youtu.be/ye1tcfT84hE

## Requirements

- Node.js 18 or newer
- npm
- A MongoDB instance, either local or MongoDB Atlas

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root, next to `server.js`:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```

   For MongoDB Atlas, replace the placeholder with your Atlas connection string. For a local MongoDB instance, you can use:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/readmore
   PORT=3000
   ```

   The database name in the URI is configurable; MongoDB creates the database when data is first written. Do not commit or share `.env` because it contains database credentials.

3. Start the API:

   ```bash
   npm start
   ```

   The server connects to MongoDB before it starts listening. By default, it listens on port `3000`.

4. Check that the API is running:

   ```http
   GET http://localhost:3000/
   ```

   Expected response:

   ```json
   {
     "message": "ReadMore API is running"
   }
   ```

## Data model

- **Author:** `name` (required), `country`, and `bio`.
- **Book:** `title`, `genre`, `price`, `publishedYear`, and `author` (all required). `author` is a MongoDB ObjectId reference to an Author.

Book reads populate the author reference and return the author's details.

## API endpoints

### Authors

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/authors` | Create an author |
| `GET` | `/authors` | List authors |
| `GET` | `/authors/:id` | Get one author |
| `PUT` | `/authors/:id` | Update an author |
| `DELETE` | `/authors/:id` | Delete an author if they have no books |
| `GET` | `/authors/:id/books` | List an author's books |
| `GET` | `/authors/:id/stats` | Get statistics for an author's books |

Example author body:

```json
{
  "name": "Chinua Achebe",
  "country": "Nigeria",
  "bio": "Nigerian novelist"
}
```

### Books

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/books` | Create a book for an existing author |
| `GET` | `/books` | List books with optional filters, sorting, and pagination |
| `GET` | `/books/:id` | Get one book, including its author details |
| `PUT` | `/books/:id` | Update a book |
| `DELETE` | `/books/:id` | Delete a book |

Example book body (replace `AUTHOR_ID` with an existing author's `_id`):

```json
{
  "title": "Things Fall Apart",
  "genre": "Novel",
  "price": 21.5,
  "publishedYear": 1958,
  "author": "AUTHOR_ID"
}
```

`PUT` requests accept one or more fields from the corresponding create body.

### Book filters and pagination

`GET /books` accepts any combination of these optional query parameters:

| Parameter | Description |
| --- | --- |
| `genre` | Match a genre |
| `minPrice` | Include books at or above this price |
| `maxPrice` | Include books at or below this price |
| `author` | Match an author's ObjectId |
| `search` | Case-insensitive text search in the title |
| `sort` | Sort by `price`, `title`, or `publishedYear` |
| `order` | `asc` or `desc`; used with `sort` |
| `page` | Page number; defaults to `1` |
| `limit` | Results per page; defaults to `20`, maximum `100` |

Example combining filters, sort, and pagination:

```http
GET /books?genre=Novel&minPrice=10&maxPrice=30&sort=price&order=asc&page=1&limit=5
```

The response includes `page`, `limit`, `total`, and `results`. Invalid query values return `400`.

### Author statistics

`GET /authors/:id/stats` returns the author's name, book count, average price, and the titles of the cheapest and most expensive books. When the author has no books, `bookCount` and `averagePrice` are `0`, and both book-title fields are `null`.

## Business rules and status codes

- Creating a book with a missing, invalid, or nonexistent author is rejected with **400**.
- A book title must be unique per author, ignoring letter case; duplicates return **409**. Different authors may use the same title.
- A price must be greater than zero. A publication year must be from 1450 through the current year. Invalid values return **422**.
- Deleting an author who still has books is blocked with **409**. This policy preserves book records and prevents orphaned author references. Its trade-off is that the books must be deleted before the author can be deleted.
- Requests for valid but missing author or book IDs return **404**.

## Project structure

```text
server.js                 Loads configuration, connects to MongoDB, and starts the server
app.js                    Configures Express and mounts routes
config/database.js        MongoDB connection
models/                   Mongoose Author and Book schemas
routes/                   HTTP route definitions
controllers/              Request handling and application rules
middleware/               Not-found and error handling
utils/                    Shared error, async, and book-query helpers
```

## Try it with Postman

Keep the server running in a terminal, then create requests in Postman using `http://localhost:3000` as the base URL. Use **Body → raw → JSON** for `POST` and `PUT` requests. Create an author first, then use its returned `_id` when creating a book. Postman displays the HTTP status code and response for each request.

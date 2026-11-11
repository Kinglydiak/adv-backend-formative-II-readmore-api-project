const express = require('express');
const authorController = require('../controllers/authorController');

const router = express.Router();

router.get('/:id/books', authorController.getAuthorBooks);
router.get('/:id/stats', authorController.getAuthorStats);
router.post('/', authorController.createAuthor);
router.get('/', authorController.getAuthors);
router.get('/:id', authorController.getAuthor);
router.put('/:id', authorController.updateAuthor);
router.delete('/:id', authorController.deleteAuthor);

module.exports = router;

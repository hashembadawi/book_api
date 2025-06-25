require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// connect to mongo db
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Connection error:', err));

// book shchema
const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Book = mongoose.model('Book', bookSchema);

//Add book Url
app.post('/api/books/add', async (req, res) => {
  try {
    const { name, author, price, imageUrl } = req.body;
    const newBook = new Book({
      name,
      author,
      price: parseFloat(price),
      imageUrl: imageUrl || ''
    });

    await newBook.save();
    res.status(201).json({ message: 'Book added successfully', book: newBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Get all books Url
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get single book by ID URL
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.status(200).json(book);
  } catch (error) {
    // Handle invalid ID format (CastError)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update book by ID (PUT)
app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, author, price } = req.body;

    // Check if the book exists
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { 
        name: name || existingBook.name, // Keep existing if not provided
        author: author || existingBook.author,
        price: price !== undefined ? parseFloat(price) : existingBook.price
      },
      { new: true } // Return the updated document
    );

    res.status(200).json({ 
      message: 'Book updated successfully', 
      book: updatedBook 
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete book by ID
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params)
    // Check if the book exists and delete it
    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ 
      message: 'Book deleted successfully',
      book: deletedBook 
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
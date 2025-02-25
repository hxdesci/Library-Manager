import { generateUniqueId } from './utils.js';

export default class DatabaseService {
    static async addBook(bookData) {
        try {
            const uniqueId = generateUniqueId(bookData.title, bookData.author);
            const booksRef = firebase.database().ref('books');

            // Check if the book already exists
            const snapshot = await booksRef.child(uniqueId).once('value');
            if (snapshot.exists()) {
                console.warn('Book already exists:', uniqueId);
                throw new Error('Book already exists');
            }

            const book = {
                id: uniqueId,
                ...bookData,
                isAvailable: true,
                createdAt: new Date().toISOString(),
                quantity: parseInt(bookData.quantity) || 1,
                year: parseInt(bookData.year) || new Date().getFullYear()
            };
            await booksRef.child(uniqueId).set(book);
            console.log('Book added successfully:', book);
            return book;
        } catch (error) {
            console.error("Error adding book:", error);
            throw error;
        }
    }

    static async updateBook(bookId, updates) {
        try {
            const bookRef = firebase.database().ref(`books/${bookId}`);
            const snapshot = await bookRef.once('value');
            if (snapshot.exists()) {
                // Update the book if it exists
                await bookRef.update(updates);
                console.log('Book updated successfully:', bookId, updates);
            } else {
                // Create the book if it doesn't exist
                await bookRef.set(updates);
                console.log('Book created successfully:', bookId, updates);
            }
            return true;
        } catch (error) {
            console.error("Error updating book:", error);
            throw error;
        }
    }

    static async deleteBook(bookId) {
        try {
            await firebase.database().ref(`books/${bookId}`).remove();
            return true;
        } catch (error) {
            console.error("Error deleting book:", error);
            throw error;
        }
    }

    static onBooksChange(callback) {
        firebase.database().ref('books').on('value', (snapshot) => {
            const books = snapshot.val() || {};
            callback(Object.values(books));
        });
    }

    static async loadBooks() {
        try {
            const snapshot = await firebase.database().ref('books').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error loading books:", error);
            return {};
        }
    }

    static watchBooks(callback) {
        firebase.database().ref('books').on('value', (snapshot) => {
            const books = snapshot.val() || {};
            callback(books);
        });
    }

    static async updateBookStatus(bookId, isAvailable, borrowerInfo = null) {
        try {
            const updates = {
                isAvailable: isAvailable,
                borrowerName: borrowerInfo?.borrowerName || null,
                borrowTime: borrowerInfo?.borrowTime || null
            };

            await this.updateBook(bookId, updates);
            return true;
        } catch (error) {
            console.error("Error updating book status:", error);
            throw error;
        }
    }

    static generateNewId() {
        return firebase.database().ref().push().key;
    }

    static async addBorrowedBook(bookData) {
        try {
            const borrowedBooksRef = firebase.database().ref('books');
            const newBorrowedRef = borrowedBooksRef.push();
            const borrowedBook = {
                ...bookData,
                id: newBorrowedRef.key,
                originalBookId: bookData.id // Store reference to original book
            };
            await newBorrowedRef.set(borrowedBook);
            return borrowedBook;
        } catch (error) {
            console.error("Error adding borrowed book:", error);
            throw error;
        }
    }

    static async returnBook(borrowedBookId) {
        try {
            // Get the borrowed book record
            const borrowedBook = await this.getBook(borrowedBookId);
            if (!borrowedBook) {
                console.error('Borrowed book not found:', borrowedBookId);
                throw new Error('Borrowed book record not found');
            }

            console.log('Found borrowed book:', borrowedBook);

            // Ensure originalBookId is set
            const originalBookId = borrowedBook.originalBookId;
            if (!originalBookId) {
                console.error('No originalBookId found in borrowed book:', borrowedBook);
                throw new Error('Original book ID not found in borrowed book record');
            }

            console.log('Original Book ID:', originalBookId);

            // Get the original book using originalBookId
            let originalBook = await this.getBook(originalBookId);

            if (!originalBook) {
                console.warn('Original book not found:', originalBookId, 'Creating a new one.');

                // Create a new book entry
                const newBook = {
                    title: borrowedBook.title,
                    author: borrowedBook.author,
                    year: borrowedBook.year,
                    quantity: borrowedBook.borrowedQuantity || 1,
                    isAvailable: true,
                    createdAt: new Date().toISOString()
                };

                try {
                    await this.addBook(newBook);
                } catch (addError) {
                    console.error('Error adding book:', addError);
                    // If the book already exists, update the quantity
                    if (addError.message === 'Book already exists') {
                        const uniqueId = generateUniqueId(newBook.title, newBook.author);
                        originalBook = await this.getBook(uniqueId);
                        if (originalBook) {
                            const updatedBook = {
                                title: originalBook.title,
                                author: originalBook.author,
                                year: originalBook.year,
                                quantity: (originalBook.quantity || 0) + (borrowedBook.borrowedQuantity || 1),
                                isAvailable: true
                            };
                            await this.updateBook(uniqueId, updatedBook);
                        }
                    } else {
                        throw addError; // Re-throw the error if it's not "Book already exists"
                    }
                }
            } else {
                console.log('Original book data:', originalBook);

                // Update the original book's quantity
                const updatedBook = {
                    title: originalBook.title,
                    author: originalBook.author,
                    year: originalBook.year,
                    quantity: (originalBook.quantity || 0) + (borrowedBook.borrowedQuantity || 1),
                    isAvailable: true
                };
            
                // First update the original book
                await this.updateBook(originalBookId, updatedBook);
            }
            
            // Then delete the borrowed book record
            await this.deleteBook(borrowedBookId);
            
            console.log('Successfully returned book to:', originalBookId);
            return true;

        } catch (error) {
            console.error('Error in returnBook:', error);
            throw error;
        }
    }

    static async getBook(bookId) {
        try {
            const snapshot = await firebase.database().ref(`books/${bookId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error("Error getting book:", error);
            return null;
        }
    }
}

// Make service available globally
window.DatabaseService = DatabaseService;

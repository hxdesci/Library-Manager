// Library Manager
class LibraryManager {
    constructor() {
        this.books = JSON.parse(localStorage.getItem('libraryBooks')) || [];
    }

    saveToLocalStorage() {
        localStorage.setItem('libraryBooks', JSON.stringify(this.books));
    }

    addBook(title, author, year, quantity) {
        const existingBook = this.books.find(
            book => book.title.toLowerCase() === title.toLowerCase() &&
                    book.author.toLowerCase() === author.toLowerCase() &&
                    book.isOriginal
        );

        if (existingBook) {
            existingBook.quantity += quantity;
        } else {
            const newBook = {
                id: this.books.length > 0 ? Math.max(...this.books.map(book => book.id)) + 1 : 1,
                title,
                author,
                year,
                quantity,
                isAvailable: true,
                isOriginal: true,
                borrowerName: '',
                borrowTime: '',
                borrowedQuantity: 0
            };
            this.books.push(newBook);
        }

        this.saveToLocalStorage();
    }

    removeBook(bookId) {
        this.books = this.books.filter(book => book.id !== bookId);
        this.saveToLocalStorage();
    }

    updateBookQuantity(bookId, newQuantity) {
        const book = this.books.find(book => book.id === bookId);
        if (book) {
            book.quantity = newQuantity;
            this.saveToLocalStorage();
        }
    }

    listBooks() {
        return this.books;
    }

    searchBooks(query) {
        return this.books.filter(book =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author.toLowerCase().includes(query.toLowerCase())
        );
    }

    borrowBook(bookId, borrowerName = null, borrowedQuantity = null) {
        const book = this.books.find(book => book.id === bookId && book.isOriginal);
        if (!book) return;

        if (!borrowerName) {
            borrowerName = prompt('Enter the borrower\'s name:');
        }
        if (!borrowedQuantity) {
            borrowedQuantity = parseInt(prompt('Enter the quantity to borrow:'));
        }

        if (borrowerName && !isNaN(borrowedQuantity) && borrowedQuantity > 0 && borrowedQuantity <= book.quantity) {
            const borrowedBook = {
                id: this.books.length > 0 ? Math.max(...this.books.map(b => b.id)) + 1 : 1,
                title: book.title,
                author: book.author,
                year: book.year,
                quantity: borrowedQuantity,
                isAvailable: false,
                isOriginal: false,
                borrowerName: borrowerName,
                borrowTime: new Date().toLocaleString(),
                borrowedQuantity: borrowedQuantity
            };

            book.quantity -= borrowedQuantity;
            if (book.quantity === 0) {
                book.isAvailable = false;
            }

            this.books.push(borrowedBook);
            this.saveToLocalStorage();
        } else {
            alert('Invalid quantity or missing borrower name.');
        }
    }

    returnBook(bookId) {
        const book = this.books.find(book => book.id === bookId && !book.isOriginal);
        if (!book) return;

        const originalBook = this.books.find(b => b.title === book.title && b.author === book.author && b.isOriginal);
        if (originalBook) {
            originalBook.quantity += book.borrowedQuantity;
            originalBook.isAvailable = true;
        }

        this.books = this.books.filter(b => b.id !== bookId);
        this.saveToLocalStorage();
    }

    sortBooks(criteria, order = 'asc') {
        return this.books.sort((a, b) => {
            if (a[criteria] < b[criteria]) return order === 'asc' ? -1 : 1;
            if (a[criteria] > b[criteria]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
}

const library = new LibraryManager();
let currentSearchQuery = '';
let filteredBooks = null;

function addBookToLibrary(event) {
    event.preventDefault();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const year = parseInt(document.getElementById('year').value.trim());
    const quantity = parseInt(document.getElementById('quantity').value.trim());

    if (title && author && year > 0 && quantity > 0) {
        library.addBook(title, author, year, quantity);
        document.getElementById('addBookForm').reset();
        updateBookList();
    } else {
        alert('Please provide valid inputs for all fields.');
    }
}

function isAdmin() {
    return localStorage.getItem('userRole') === 'admin';
}

function updateBookList(booksToDisplay = null) {
    const availableBooksDiv = document.getElementById('available-books').querySelector('.book-list');
    const unavailableBooksDiv = document.getElementById('unavailable-books').querySelector('.book-list');
    const books = booksToDisplay || library.listBooks();

    availableBooksDiv.innerHTML = '';
    unavailableBooksDiv.innerHTML = '';

    const availableBooks = books.filter(book => book.isAvailable && book.isOriginal);
    const unavailableBooks = books.filter(book => !book.isAvailable && !book.isOriginal);

    if (availableBooks.length === 0) {
        availableBooksDiv.innerHTML = '<p class="empty-state">No available books found.</p>';
    } else {
        availableBooks.forEach(book => {
            const bookDiv = document.createElement('div');
            bookDiv.className = 'book';
            let buttons = '';
            if (isAdmin()) {
                buttons = `
                    <button onclick="borrowBook(${book.id})">Borrow</button>
                    <button onclick="removeBook(${book.id})">Remove</button>
                `;
            } else {
                buttons = `<button onclick="borrowBook(${book.id})">Borrow</button>`;
            }
            bookDiv.innerHTML = `
                <p><strong>Title:</strong> ${book.title}</p>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Year:</strong> ${book.year}</p>
                <p><strong>Quantity:</strong> ${book.quantity}</p>
                ${buttons}
            `;
            availableBooksDiv.appendChild(bookDiv);
        });
    }

    if (unavailableBooks.length === 0) {
        unavailableBooksDiv.innerHTML = '<p class="empty-state">No unavailable books found.</p>';
    } else {
        unavailableBooks.forEach(book => {
            const bookDiv = document.createElement('div');
            bookDiv.className = 'book';
            bookDiv.innerHTML = `
                <p><strong>Title:</strong> ${book.title}</p>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Year:</strong> ${book.year}</p>
                <p><strong>Quantity:</strong> ${book.borrowedQuantity}</p>
                <p><strong>Borrower:</strong> ${book.borrowerName}</p>
                <p><strong>Borrowed At:</strong> ${book.borrowTime}</p>
                <button onclick="returnBook(${book.id})">Return</button>
                <button onclick="removeBook(${book.id})">Remove</button>
            `;
            unavailableBooksDiv.appendChild(bookDiv);
        });
    }

    // Update total books count
    const totalBooksCount = books.reduce((total, book) => total + (book.isOriginal ? book.quantity : 0), 0);
    document.getElementById('totalBooksCount').innerText = totalBooksCount;

    // Update borrow history
    updateBorrowHistory();
}

function updateBorrowHistory() {
    const borrowHistoryTableBody = document.getElementById('borrowHistoryTableBody');
    const borrowedBooks = library.books.filter(book => !book.isOriginal);

    borrowHistoryTableBody.innerHTML = '';
    if (borrowedBooks.length === 0) {
        borrowHistoryTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No borrow history found.</td></tr>';
    } else {
        borrowedBooks.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.borrowerName}</td>
                <td>${book.borrowTime}</td>
                <td>${book.borrowedQuantity}</td>
            `;
            borrowHistoryTableBody.appendChild(row);
        });
    }
}

function borrowBook(bookId) {
    const book = library.books.find(book => book.id === bookId);
    if (!book) return;

    if (!isAdmin()) {
        // Students can only borrow one copy at a time
        const borrowerName = localStorage.getItem('username');
        library.borrowBook(bookId, borrowerName, 1);
    } else {
        library.borrowBook(bookId);
    }
    updateBookList(filteredBooks || library.listBooks());
}

function returnBook(bookId) {
    library.returnBook(bookId);
    updateBookList(filteredBooks || library.listBooks());
}

function removeBook(bookId) {
    library.removeBook(bookId);
    updateBookList(filteredBooks || library.listBooks());
}

function updateBookQuantity(bookId, newQuantity) {
    const parsedQuantity = parseInt(newQuantity);
    if (!isNaN(parsedQuantity) && parsedQuantity >= 0) {
        library.updateBookQuantity(bookId, parsedQuantity);
        updateBookList(filteredBooks || library.listBooks());
    } else {
        alert('Please enter a valid quantity.');
    }
}

function searchBooks() {
    currentSearchQuery = document.getElementById('searchQuery').value.trim();
    if (currentSearchQuery) {
        filteredBooks = library.searchBooks(currentSearchQuery);
        updateBookList(filteredBooks);
    } else {
        filteredBooks = null;
        updateBookList();
    }
}

function sortBooks() {
    const sortBy = document.getElementById('sortBooks').value;
    const sortedBooks = library.sortBooks(sortBy);
    updateBookList(sortedBooks);
}

function generateBorrowedBooksReport() {
    const borrowedBooks = library.books.filter(book => !book.isOriginal);
    if (borrowedBooks.length === 0) {
        alert('No borrowed books found.');
        return;
    }

    let report = 'Borrowed Books Report\n\n';
    report += 'Title\tAuthor\tBorrower\tBorrowed At\tQuantity\n';
    borrowedBooks.forEach(book => {
        report += `${book.title}\t${book.author}\t${book.borrowerName}\t${book.borrowTime}\t${book.borrowedQuantity}\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'borrowed_books_report.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize book list on page load
updateBookList();
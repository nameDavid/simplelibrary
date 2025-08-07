// Library Management JavaScript

let currentUser = null;
let editingBookId = null;
let deleteBookId = null;

// Check authentication and initialize
document.addEventListener('DOMContentLoaded', function() {
    const storedUser = localStorage.getItem('currentUser');
    
    if (!storedUser) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(storedUser);
    initializeDashboard();
});

function initializeDashboard() {
    // Display welcome message
    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser.name}!`;
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display books
    loadBooks();
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Add book button
    document.getElementById('addBookBtn').addEventListener('click', openAddBookModal);
    
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', searchBooks);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });
    
    // Modal event listeners
    document.querySelector('.close').addEventListener('click', closeBookModal);
    document.getElementById('cancelBtn').addEventListener('click', closeBookModal);
    document.getElementById('bookForm').addEventListener('submit', saveBook);
    
    // Delete modal event listeners
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    
    // File input change handler
    document.getElementById('bookCover').addEventListener('change', handleFileSelect);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const bookModal = document.getElementById('bookModal');
        const deleteModal = document.getElementById('deleteModal');
        if (e.target === bookModal) {
            closeBookModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function getUserBooks() {
    const allBooks = JSON.parse(localStorage.getItem('books') || '[]');
    return allBooks.filter(book => book.userId === currentUser.id);
}

function saveBooks(books) {
    const allBooks = JSON.parse(localStorage.getItem('books') || '[]');
    const otherUsersBooks = allBooks.filter(book => book.userId !== currentUser.id);
    const updatedBooks = [...otherUsersBooks, ...books];
    localStorage.setItem('books', JSON.stringify(updatedBooks));
}

function loadBooks(booksToShow = null) {
    const books = booksToShow || getUserBooks();
    const container = document.getElementById('booksContainer');
    const noBooksMessage = document.getElementById('noBooksMessage');
    const booksTable = document.getElementById('booksTable');
    
    if (books.length === 0) {
        container.innerHTML = '';
        noBooksMessage.style.display = 'block';
        booksTable.style.display = 'none';
        return;
    }
    
    noBooksMessage.style.display = 'none';
    booksTable.style.display = 'table';
    container.innerHTML = books.map(book => createBookRow(book)).join('');
}

function createBookRow(book) {
    const coverDisplay = book.cover 
        ? `<img src="${book.cover}" alt="Book cover">` 
        : '<div class="no-cover">No Cover</div>';
    
    const description = book.description 
        ? `<span title="${escapeHtml(book.description)}">${escapeHtml(book.description)}</span>`
        : '-';
    
    return `
        <tr>
            <td>
                <div class="book-cover-cell ${book.cover ? '' : 'no-cover'}">
                    ${coverDisplay}
                </div>
            </td>
            <td><strong>${escapeHtml(book.title)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.isbn)}</td>
            <td>${book.genre ? escapeHtml(book.genre) : '-'}</td>
            <td>${book.year || '-'}</td>
            <td class="description-cell">${description}</td>
            <td>
                <div class="book-actions">
                    <button class="edit-btn" onclick="editBook('${book.id}')">Edit</button>
                    <button class="delete-btn" onclick="openDeleteModal('${book.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openAddBookModal() {
    editingBookId = null;
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookForm').reset();
    document.getElementById('currentCover').innerHTML = '';
    document.getElementById('bookModal').style.display = 'block';
}

function editBook(bookId) {
    const books = getUserBooks();
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    editingBookId = bookId;
    document.getElementById('modalTitle').textContent = 'Edit Book';
    
    // Populate form
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookISBN').value = book.isbn;
    document.getElementById('bookGenre').value = book.genre || '';
    document.getElementById('bookYear').value = book.year || '';
    document.getElementById('bookDescription').value = book.description || '';
    
    // Show current cover if exists
    const currentCoverDiv = document.getElementById('currentCover');
    if (book.cover) {
        currentCoverDiv.innerHTML = `<p>Current cover:</p><img src="${book.cover}" alt="Current cover">`;
    } else {
        currentCoverDiv.innerHTML = '<p>No current cover image</p>';
    }
    
    document.getElementById('bookModal').style.display = 'block';
}

function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
    editingBookId = null;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const currentCoverDiv = document.getElementById('currentCover');
            currentCoverDiv.innerHTML = `<p>Preview:</p><img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

function saveBook(event) {
    event.preventDefault();
    
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const isbn = document.getElementById('bookISBN').value.trim();
    const genre = document.getElementById('bookGenre').value.trim();
    const year = document.getElementById('bookYear').value;
    const description = document.getElementById('bookDescription').value.trim();
    const coverFile = document.getElementById('bookCover').files[0];
    
    const books = getUserBooks();
    
    // Check for duplicate ISBN (except when editing the same book)
    const duplicateISBN = books.find(book => book.isbn === isbn && book.id !== editingBookId);
    if (duplicateISBN) {
        alert('A book with this ISBN already exists!');
        return;
    }
    
    const bookData = {
        title,
        author,
        isbn,
        genre,
        year: year ? parseInt(year) : null,
        description,
        userId: currentUser.id
    };
    
    function saveBookData(coverData = null) {
        if (coverData) {
            bookData.cover = coverData;
        } else if (editingBookId) {
            // Keep existing cover if no new file selected
            const existingBook = books.find(b => b.id === editingBookId);
            if (existingBook && existingBook.cover) {
                bookData.cover = existingBook.cover;
            }
        }
        
        if (editingBookId) {
            // Update existing book
            bookData.id = editingBookId;
            const bookIndex = books.findIndex(b => b.id === editingBookId);
            books[bookIndex] = bookData;
        } else {
            // Add new book
            bookData.id = Date.now().toString();
            books.push(bookData);
        }
        
        saveBooks(books);
        loadBooks();
        closeBookModal();
        
        const action = editingBookId ? 'updated' : 'added';
        alert(`Book ${action} successfully!`);
    }
    
    // Handle file upload
    if (coverFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveBookData(e.target.result);
        };
        reader.readAsDataURL(coverFile);
    } else {
        saveBookData();
    }
}

function openDeleteModal(bookId) {
    deleteBookId = bookId;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteBookId = null;
}

function confirmDelete() {
    if (!deleteBookId) return;
    
    const books = getUserBooks();
    const updatedBooks = books.filter(book => book.id !== deleteBookId);
    
    saveBooks(updatedBooks);
    loadBooks();
    closeDeleteModal();
    
    alert('Book deleted successfully!');
}

function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadBooks();
        return;
    }
    
    const books = getUserBooks();
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn.toLowerCase().includes(searchTerm) ||
        (book.genre && book.genre.toLowerCase().includes(searchTerm)) ||
        (book.description && book.description.toLowerCase().includes(searchTerm))
    );
    
    loadBooks(filteredBooks);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    loadBooks();
}

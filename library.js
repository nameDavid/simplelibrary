// Library Management JavaScript

let currentUser = null;
let editingBookId = null;
let deleteBookId = null;

// Check authentication and initialize
$(function() {
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
    $('#welcomeUser').text(`Welcome, ${currentUser.name}!`);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display books
    loadBooks();
}

function setupEventListeners() {
    // Logout button
    $('#logoutBtn').on('click', logout);
    
    // Add book button
    $('#addBookBtn').on('click', openAddBookModal);
    
    // Search functionality
    $('#searchBtn').on('click', searchBooks);
    $('#clearSearchBtn').on('click', clearSearch);
    $('#searchInput').on('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });
    
    // Modal event listeners
    $('.close').on('click', closeBookModal);
    $('#cancelBtn').on('click', closeBookModal);
    $('#bookForm').on('submit', saveBook);
    
    // Delete modal event listeners
    $('#confirmDeleteBtn').on('click', confirmDelete);
    $('#cancelDeleteBtn').on('click', closeDeleteModal);
    
    // File input change handler
    $('#bookCover').on('change', handleFileSelect);
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        const $target = $(e.target);
        if ($target.is('#bookModal')) {
            closeBookModal();
        }
        if ($target.is('#deleteModal')) {
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
    const $container = $('#booksContainer');
    const $noBooksMessage = $('#noBooksMessage');
    const $booksTable = $('#booksTable');
    if (books.length === 0) {
        $container.html('');
        $noBooksMessage.show();
        $booksTable.css('display', 'none');
        return;
    }
    $noBooksMessage.hide();
    $booksTable.css('display', 'table');
    $container.html(books.map(book => createBookRow(book)).join(''));
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
    $('#bookForm')[0].reset();
    $('#currentCover').html('');
    $('#bookModal').show();
}

function editBook(bookId) {
    const books = getUserBooks();
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    editingBookId = bookId;
    $('#modalTitle').text('Edit Book');
    
    // Populate form
    $('#bookTitle').val(book.title);
    $('#bookAuthor').val(book.author);
    $('#bookISBN').val(book.isbn);
    $('#bookGenre').val(book.genre || '');
    $('#bookYear').val(book.year || '');
    $('#bookDescription').val(book.description || '');
    
    // Show current cover if exists
    const $currentCoverDiv = $('#currentCover');
    if (book.cover) {
        $currentCoverDiv.html(`<p>Current cover:</p><img src="${book.cover}" alt="Current cover">`);
    } else {
        $currentCoverDiv.html('<p>No current cover image</p>');
    }
    $('#bookModal').show();
}

function closeBookModal() {
    $('#bookModal').hide();
    editingBookId = null;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#currentCover').html(`<p>Preview:</p><img src="${e.target.result}" alt="Preview">`);
        };
        reader.readAsDataURL(file);
    }
}

function saveBook(event) {
    event.preventDefault();
    
    const title = $('#bookTitle').val().trim();
    const author = $('#bookAuthor').val().trim();
    const isbn = $('#bookISBN').val().trim();
    const genre = $('#bookGenre').val().trim();
    const year = $('#bookYear').val();
    const description = $('#bookDescription').val().trim();
    const coverFile = $('#bookCover')[0].files[0];
    
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
    $('#deleteModal').show();
}

function closeDeleteModal() {
    $('#deleteModal').hide();
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
    $('#searchInput').val('');
    loadBooks();
}

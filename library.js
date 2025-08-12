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
    
    // Text extraction handlers
    $('#addTextBtn').on('click', addTextExtract);
    $('#importTextBtn').on('click', function() {
        $('#textFile').click();
    });
    $('#textFile').on('change', handleTextFileImport);
    
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
    $('#modalTitle').text('Add New Book');
    $('#bookForm')[0].reset();
    $('#currentCover').html('');
    $('#textExtracts').html('<div class="no-extracts">No text extracts added yet. Click "Add Text Extract" to begin.</div>');
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
    
    // Display text extracts
    displayTextExtracts(book.textExtracts || []);
    
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
    const textExtracts = collectTextExtracts();
    
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
        textExtracts,
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
    const searchTerm = $('#searchInput').val().toLowerCase().trim();
    
    if (!searchTerm) {
        loadBooks();
        return;
    }
    
    const books = getUserBooks();
    const filteredBooks = books.filter(book => {
        // Search in basic book fields
        const basicSearch = book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.isbn.toLowerCase().includes(searchTerm) ||
            (book.genre && book.genre.toLowerCase().includes(searchTerm)) ||
            (book.description && book.description.toLowerCase().includes(searchTerm));
        
        // Search in text extracts
        const extractSearch = book.textExtracts && book.textExtracts.some(extract => 
            extract.text.toLowerCase().includes(searchTerm)
        );
        
        return basicSearch || extractSearch;
    });
    
    loadBooks(filteredBooks);
}

function clearSearch() {
    $('#searchInput').val('');
    loadBooks();
}

// Text Extraction Functions
function addTextExtract() {
    const extractId = Date.now();
    const extractHtml = `
        <div class="text-extract-item" data-extract-id="${extractId}">
            <div class="extract-header">
                <div class="extract-meta">
                    <label>Page: <input type="number" class="extract-page" placeholder="1" min="1"></label>
                    <label>Paragraph: <input type="number" class="extract-paragraph" placeholder="1" min="1"></label>
                    <label>Type: 
                        <select class="extract-type">
                            <option value="quote">Quote</option>
                            <option value="summary">Summary</option>
                            <option value="note">Note</option>
                            <option value="chapter">Chapter</option>
                        </select>
                    </label>
                </div>
                <button type="button" class="remove-extract-btn" onclick="removeTextExtract('${extractId}')">Remove</button>
            </div>
            <textarea class="extract-text" placeholder="Enter or paste text extract here..."></textarea>
            <div class="extract-search-info">This text will be searchable when you search for books</div>
        </div>
    `;
    
    const $container = $('#textExtracts');
    if ($container.find('.no-extracts').length) {
        $container.html('');
    }
    $container.append(extractHtml);
}

function removeTextExtract(extractId) {
    $(`[data-extract-id="${extractId}"]`).remove();
    
    const $container = $('#textExtracts');
    if ($container.children().length === 0) {
        $container.html('<div class="no-extracts">No text extracts added yet. Click "Add Text Extract" to begin.</div>');
    }
}

function handleTextFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        
        // Create a new extract with the imported text
        addTextExtract();
        
        // Get the last added extract and populate it
        const $lastExtract = $('#textExtracts .text-extract-item').last();
        $lastExtract.find('.extract-text').val(text);
        $lastExtract.find('.extract-type').val('chapter');
        
        // Clear the file input
        $('#textFile').val('');
    };
    reader.readAsText(file);
}

function collectTextExtracts() {
    const extracts = [];
    $('#textExtracts .text-extract-item').each(function() {
        const $item = $(this);
        const text = $item.find('.extract-text').val().trim();
        
        if (text) {
            extracts.push({
                page: parseInt($item.find('.extract-page').val()) || null,
                paragraph: parseInt($item.find('.extract-paragraph').val()) || null,
                type: $item.find('.extract-type').val(),
                text: text
            });
        }
    });
    return extracts;
}

function displayTextExtracts(extracts) {
    const $container = $('#textExtracts');
    
    if (!extracts || extracts.length === 0) {
        $container.html('<div class="no-extracts">No text extracts added yet. Click "Add Text Extract" to begin.</div>');
        return;
    }
    
    $container.html('');
    extracts.forEach((extract, index) => {
        const extractId = Date.now() + index;
        const extractHtml = `
            <div class="text-extract-item" data-extract-id="${extractId}">
                <div class="extract-header">
                    <div class="extract-meta">
                        <label>Page: <input type="number" class="extract-page" value="${extract.page || ''}" placeholder="1" min="1"></label>
                        <label>Paragraph: <input type="number" class="extract-paragraph" value="${extract.paragraph || ''}" placeholder="1" min="1"></label>
                        <label>Type: 
                            <select class="extract-type">
                                <option value="quote" ${extract.type === 'quote' ? 'selected' : ''}>Quote</option>
                                <option value="summary" ${extract.type === 'summary' ? 'selected' : ''}>Summary</option>
                                <option value="note" ${extract.type === 'note' ? 'selected' : ''}>Note</option>
                                <option value="chapter" ${extract.type === 'chapter' ? 'selected' : ''}>Chapter</option>
                            </select>
                        </label>
                    </div>
                    <button type="button" class="remove-extract-btn" onclick="removeTextExtract('${extractId}')">Remove</button>
                </div>
                <textarea class="extract-text" placeholder="Enter or paste text extract here...">${escapeHtml(extract.text)}</textarea>
                <div class="extract-search-info">This text will be searchable when you search for books</div>
            </div>
        `;
        $container.append(extractHtml);
    });
}

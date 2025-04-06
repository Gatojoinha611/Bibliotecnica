let books = JSON.parse(localStorage.getItem('books')) || [];
let isShowingFavorites = false;

// Garante que todos os modals começam fechados
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('details-modal').style.display = 'none';
    document.getElementById('themes-modal').style.display = 'none';
});

// Event Listeners
document.getElementById('add-book-btn').addEventListener('click', () => openModal('Adicionar Novo Livro'));
document.getElementById('close-modal').addEventListener('click', () => closeModal('modal'));
document.getElementById('close-details').addEventListener('click', () => closeModal('details-modal'));
document.getElementById('close-themes').addEventListener('click', () => closeModal('themes-modal'));
document.getElementById('book-form').addEventListener('submit', saveBook);
document.getElementById('search-bar').addEventListener('input', filterBooks);
document.getElementById('genre-filter').addEventListener('change', filterBooks);
document.getElementById('toggle-favorites').addEventListener('click', toggleFavorites);
document.getElementById('toggle-themes').addEventListener('click', () => document.getElementById('themes-modal').style.display = 'block');
document.getElementById('search-online-btn').addEventListener('click', searchOnline);
document.getElementById('remove-cover-btn').addEventListener('click', removeCoverImage);
document.getElementById('cover-image').addEventListener('change', previewCover);
document.getElementById('export-books').addEventListener('click', exportBooks);
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-books').click());
document.getElementById('import-books').addEventListener('change', importBooks);

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});

// Funções
function openModal(title, book = null) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    
    // Reseta todos os campos por padrão
    document.getElementById('book-id').value = '';
    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('genre').value = '';
    document.getElementById('review').value = '';
    document.getElementById('rating').value = '';
    document.getElementById('read-date').value = '';
    document.getElementById('status').value = '';
    document.getElementById('cover-image').value = '';
    document.getElementById('cover-image').dataset.onlineCover = '';
    const preview = document.getElementById('cover-preview');
    preview.style.display = 'none';
    preview.src = '';

    // Se for edição, preenche com os dados do livro
    if (book) {
        document.getElementById('book-id').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('genre').value = book.genre;
        document.getElementById('review').value = book.review;
        document.getElementById('rating').value = book.rating;
        document.getElementById('read-date').value = book.readDate;
        document.getElementById('status').value = book.status;
        if (book.cover) {
            preview.src = book.cover;
            preview.style.display = 'block';
        }
    }

    modal.style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function saveBook(e) {
    e.preventDefault();
    const book = {
        id: document.getElementById('book-id').value || Date.now().toString(),
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        genre: document.getElementById('genre').value,
        review: document.getElementById('review').value,
        rating: document.getElementById('rating').value,
        readDate: document.getElementById('read-date').value,
        status: document.getElementById('status').value,
        cover: null,
        favorite: books.find(b => b.id === document.getElementById('book-id').value)?.favorite || false
    };

    const file = document.getElementById('cover-image').files[0];
    const onlineCover = document.getElementById('cover-image').dataset.onlineCover;

    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            book.cover = reader.result;
            updateBooks(book);
        };
        reader.readAsDataURL(file);
    } else if (onlineCover && !document.getElementById('book-id').value) {
        book.cover = onlineCover;
        updateBooks(book);
    } else {
        const existingBook = books.find(b => b.id === book.id);
        book.cover = existingBook ? existingBook.cover : null;
        updateBooks(book);
    }

    closeModal('modal');
}

function updateBooks(book) {
    const index = books.findIndex(b => b.id === book.id);
    if (index !== -1) {
        books[index] = book;
    } else {
        books.push(book);
        updateGenreFilter(book.genre);
    }
    localStorage.setItem('books', JSON.stringify(books)); // Salva no LocalStorage
    displayBooks();
}

function displayBooks(filteredBooks = books) {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = '';
    filteredBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="cover">
                ${book.cover ? `<img src="${book.cover}" alt="${book.title}">` : ''}
                <div class="status-indicator status-${book.status.toLowerCase().replace(' ', '-')}"></div>
            </div>
            <h3>${book.title}</h3>
            <p>${book.author}</p>
            <div class="action-buttons">
                <button class="action-btn favorite-btn ${book.favorite ? 'favorited' : ''}" data-id="${book.id}"><i class="fas fa-heart"></i></button>
                <button class="action-btn edit-btn" data-id="${book.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${book.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        card.querySelector('.cover').addEventListener('click', () => showDetails(book));
        card.querySelector('h3').addEventListener('click', () => showDetails(book));
        card.querySelector('p').addEventListener('click', () => showDetails(book));

        bookList.appendChild(card);
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => btn.addEventListener('click', toggleFavorite));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editBook(btn.dataset.id)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteBook(btn.dataset.id)));
}

function showDetails(book) {
    const details = document.getElementById('book-details');
    details.innerHTML = `
        ${book.cover ? `<img src="${book.cover}" alt="${book.title}">` : '<div class="cover"></div>'}
        <h2>${book.title}</h2>
        <p><strong>Autor:</strong> ${book.author}</p>
        ${book.genre ? `<p><strong>Gênero:</strong> ${book.genre}</p>` : ''}
        ${book.rating ? `<p><strong>Nota:</strong> ${book.rating}/5</p>` : ''}
        ${book.readDate ? `<p><strong>Data de Leitura:</strong> ${new Date(book.readDate).toLocaleDateString('pt-BR')}</p>` : ''}
        ${book.status ? `<p><strong>Status:</strong> ${book.status}</p>` : ''}
        ${book.review ? `<p><strong>Crítica:</strong> ${book.review}</p>` : ''}
    `;
    document.getElementById('details-modal').style.display = 'block';
}

function toggleFavorite(e) {
    e.stopPropagation();
    const id = e.target.closest('.favorite-btn').dataset.id;
    const book = books.find(b => b.id === id);
    book.favorite = !book.favorite;
    localStorage.setItem('books', JSON.stringify(books)); // Salva no LocalStorage
    displayBooks();
}

function editBook(id) {
    const book = books.find(b => b.id === id);
    openModal('Editar Livro', book);
}

function deleteBook(id) {
    books = books.filter(b => b.id !== id);
    localStorage.setItem('books', JSON.stringify(books)); // Salva no LocalStorage
    displayBooks();
}

function filterBooks() {
    const search = document.getElementById('search-bar').value.toLowerCase();
    const genre = document.getElementById('genre-filter').value;
    let filteredBooks = [...books];

    if (isShowingFavorites) {
        filteredBooks = filteredBooks.filter(book => book.favorite);
    }

    if (search) {
        filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(search) || 
            book.author.toLowerCase().includes(search)
        );
    }

    if (genre) {
        filteredBooks = filteredBooks.filter(book => book.genre === genre);
    }

    displayBooks(filteredBooks);
}

function toggleFavorites() {
    isShowingFavorites = !isShowingFavorites;
    document.getElementById('toggle-favorites').textContent = isShowingFavorites ? 'Mostrar Todos' : 'Mostrar Favoritos';
    filterBooks();
}

function updateGenreFilter(genre) {
    if (genre && !Array.from(document.getElementById('genre-filter').options).some(opt => opt.value === genre)) {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        document.getElementById('genre-filter').appendChild(option);
    }
}

function applyTheme(theme) {
    document.body.className = '';
    if (theme !== 'default') {
        document.body.classList.add(theme);
    }
    closeModal('themes-modal');
}

function searchOnline() {
    const query = document.getElementById('online-search').value;
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`)
        .then(response => response.json())
        .then(data => {
            const results = document.getElementById('online-results');
            results.innerHTML = '<button class="close-results-btn" id="close-results-btn">×</button>';
            data.items.forEach(item => {
                const result = document.createElement('div');
                result.className = 'online-result';
                result.textContent = `${item.volumeInfo.title} - ${item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Autor desconhecido'}`;
                result.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('title').value = item.volumeInfo.title;
                    document.getElementById('author').value = item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : '';
                    document.getElementById('genre').value = item.volumeInfo.categories ? item.volumeInfo.categories[0] : '';
                    document.getElementById('cover-image').value = '';
                    const onlineCover = item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : '';
                    document.getElementById('cover-image').dataset.onlineCover = onlineCover;
                    const preview = document.getElementById('cover-preview');
                    preview.src = onlineCover;
                    preview.style.display = onlineCover ? 'block' : 'none';
                    document.getElementById('modal').style.display = 'block';
                });
                results.appendChild(result);
            });
            document.getElementById('close-results-btn').addEventListener('click', () => {
                results.innerHTML = '';
            });
        })
        .catch(error => console.error('Erro na busca online:', error));
}

function removeCoverImage() {
    document.getElementById('cover-image').value = '';
    document.getElementById('cover-image').dataset.onlineCover = '';
    const preview = document.getElementById('cover-preview');
    preview.style.display = 'none';
    preview.src = '';
}

function previewCover(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('cover-preview');
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            preview.src = reader.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        preview.src = '';
    }
}

function exportBooks() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'biblioteca-epica.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importBooks(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedBooks = JSON.parse(event.target.result);
                books = importedBooks;
                localStorage.setItem('books', JSON.stringify(books));
                displayBooks();
                importedBooks.forEach(book => updateGenreFilter(book.genre));
                alert('Biblioteca importada com sucesso!');
                // Reseta o input file pra permitir novas importações
                document.getElementById('import-books').value = '';
            } catch (error) {
                alert('Erro ao importar a biblioteca: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Inicializa a exibição dos livros sem abrir modals
document.addEventListener('DOMContentLoaded', () => {
    displayBooks();
});
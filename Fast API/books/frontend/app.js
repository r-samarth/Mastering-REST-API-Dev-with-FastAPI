const state = { books: [], editingId: null };

const elements = {
  bookList: document.querySelector('#bookList'),
  emptyState: document.querySelector('#emptyState'),
  search: document.querySelector('#searchInput'),
  categoryFilter: document.querySelector('#categoryFilter'),
  sortBy: document.querySelector('#sortBy'),
  resultCount: document.querySelector('#resultCount'),
  form: document.querySelector('#bookForm'),
  formTitle: document.querySelector('#formTitle'),
  formEyebrow: document.querySelector('#formEyebrow'),
  submitButton: document.querySelector('#submitButton'),
  cancelEditButton: document.querySelector('#cancelEditButton'),
  formError: document.querySelector('#formError'),
  categoryOptions: document.querySelector('#categoryOptions'),
  syncStatus: document.querySelector('#syncStatus'),
};

const toast = new bootstrap.Toast(document.querySelector('#messageToast'), { delay: 2800 });
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function getVisibleBooks() {
  const search = elements.search.value.trim().toLowerCase();
  const category = elements.categoryFilter.value;
  const sortBy = elements.sortBy.value;
  return state.books
    .filter((book) => !search || `${book.title} ${book.author}`.toLowerCase().includes(search))
    .filter((book) => !category || book.category === category)
    .sort((a, b) => sortBy === 'quantity' || sortBy === 'price' ? a[sortBy] - b[sortBy] : a[sortBy].localeCompare(b[sortBy]));
}

function renderCategories() {
  const current = elements.categoryFilter.value;
  const categories = [...new Set(state.books.map((book) => book.category))].sort();
  elements.categoryFilter.innerHTML = '<option value="">All categories</option>' + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  elements.categoryFilter.value = categories.includes(current) ? current : '';
  elements.categoryOptions.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}"></option>`).join('');
}

function renderBooks() {
  const books = getVisibleBooks();
  elements.resultCount.textContent = `${books.length} ${books.length === 1 ? 'title' : 'titles'} shown`;
  elements.bookList.innerHTML = books.map((book) => {
    const lowStock = book.quantity <= 5;
    return `<article class="book-row">
      <div class="book-title-wrap"><div class="book-title">${escapeHtml(book.title)}</div><div class="book-author">${escapeHtml(book.author)}</div></div>
      <div class="book-meta"><span class="category-tag">${escapeHtml(book.category)}</span></div>
      <div class="book-price"><span class="price">${currency.format(book.price)}</span></div>
      <div class="book-stock"><span class="stock ${lowStock ? 'low' : ''}">${book.quantity} ${book.quantity === 1 ? 'copy' : 'copies'}</span></div>
      <div class="row-actions">
        <button class="icon-button" type="button" data-action="edit" data-id="${book.id}" aria-label="Edit ${escapeHtml(book.title)}" title="Edit book"><i class="bi bi-pencil"></i></button>
        <button class="icon-button delete" type="button" data-action="delete" data-id="${book.id}" aria-label="Delete ${escapeHtml(book.title)}" title="Delete book"><i class="bi bi-trash3"></i></button>
      </div>
    </article>`;
  }).join('');
  elements.emptyState.classList.toggle('d-none', books.length !== 0);
}

function render() {
  renderCategories();
  renderBooks();
}

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail?.[0]?.msg || detail?.detail || 'Something went wrong.');
  }
  return response.status === 204 ? null : response.json();
}

async function loadBooks() {
  try {
    state.books = await request('/books');
    elements.syncStatus.innerHTML = '<span class="status-dot"></span>Inventory synced';
    render();
  } catch (error) {
    elements.syncStatus.innerHTML = '<span class="status-dot" style="background:#bd4c43"></span>Could not sync';
    showToast('Unable to load the inventory. Check that the API is running.');
  }
}

function resetForm() {
  state.editingId = null;
  elements.form.reset();
  elements.formTitle.textContent = 'Add a book';
  elements.formEyebrow.textContent = 'New title';
  elements.submitButton.innerHTML = '<i class="bi bi-plus-lg"></i><span>Add to inventory</span>';
  elements.cancelEditButton.classList.add('d-none');
  elements.formError.classList.add('d-none');
}

function startEdit(book) {
  state.editingId = book.id;
  for (const field of ['title', 'author', 'category', 'price', 'quantity']) document.querySelector(`#${field}`).value = book[field];
  elements.formTitle.textContent = 'Edit book';
  elements.formEyebrow.textContent = 'Update title';
  elements.submitButton.innerHTML = '<i class="bi bi-check2"></i><span>Save changes</span>';
  elements.cancelEditButton.classList.remove('d-none');
  elements.formError.classList.add('d-none');
  document.querySelector('#bookEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(message) {
  document.querySelector('#toastMessage').textContent = message;
  toast.show();
}

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const payload = Object.fromEntries(formData.entries());
  payload.price = Number(payload.price);
  payload.quantity = Number(payload.quantity);
  elements.formError.classList.add('d-none');
  elements.submitButton.disabled = true;
  try {
    const isEditing = state.editingId !== null;
    await request(isEditing ? `/books/${state.editingId}` : '/books', { method: isEditing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    resetForm();
    await loadBooks();
    showToast(isEditing ? 'Book updated.' : 'Book added to inventory.');
  } catch (error) {
    elements.formError.textContent = error.message;
    elements.formError.classList.remove('d-none');
  } finally {
    elements.submitButton.disabled = false;
  }
});

elements.bookList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const book = state.books.find((item) => item.id === Number(button.dataset.id));
  if (!book) return;
  if (button.dataset.action === 'edit') startEdit(book);
  if (button.dataset.action === 'delete' && window.confirm(`Delete "${book.title}"?`)) {
    try {
      await request(`/books/${book.id}`, { method: 'DELETE' });
      if (state.editingId === book.id) resetForm();
      await loadBooks();
      showToast('Book removed from inventory.');
    } catch (error) { showToast(error.message); }
  }
});

[elements.search, elements.categoryFilter, elements.sortBy].forEach((control) => control.addEventListener('input', renderBooks));
elements.cancelEditButton.addEventListener('click', resetForm);
document.querySelector('#focusAddButton').addEventListener('click', () => { resetForm(); document.querySelector('#title').focus(); });

loadBooks();

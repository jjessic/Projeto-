const products = window.NEXUS_PRODUCTS;
const params = new URLSearchParams(window.location.search);
const product = products[params.get('id')] || products['graphic-nexus'];
const gallery = document.getElementById('detailGallery');
const sizeOptions = document.getElementById('detailSizes');
const cartKey = 'nexus-cart';
const favoritesKey = 'nexus-favorites';
let activeImage = 0;

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function renderGallery() {
  gallery.innerHTML = `
    <div class="detail-main-image"><img src="${product.images[activeImage]}" alt="${product.name}" /></div>
    <div class="detail-thumbnails" aria-label="Imagens do produto">
      ${product.images.map((image, index) => `
        <button type="button" class="detail-thumbnail ${index === activeImage ? 'is-active' : ''}" data-image-index="${index}" aria-label="Ver imagem ${index + 1}"><img src="${image}" alt="" /></button>
      `).join('')}
    </div>
  `;
}

function setFavoriteState(button, isFavorite) {
  button.classList.toggle('is-favorite', isFavorite);
  button.textContent = isFavorite ? '♥ Salvo nos favoritos' : '♡ Favoritar';
  button.setAttribute('aria-pressed', String(isFavorite));
}

function renderProduct() {
  document.title = `${product.name} | Nexus Store`;
  document.getElementById('detailCategory').textContent = product.category;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailPrice').textContent = formatPrice(product.price);
  document.getElementById('detailDescription').textContent = product.description;
  document.getElementById('detailDescriptionCopy').textContent = product.description;
  document.getElementById('detailMaterial').textContent = product.material;
  document.getElementById('detailFit').textContent = product.fit;
  sizeOptions.innerHTML = product.sizes.map((size, index) => `
    <label class="size-option ${index === 0 ? 'is-selected' : ''}"><input type="radio" name="size" value="${size}" ${index === 0 ? 'checked' : ''} /><span>${size}</span></label>
  `).join('');

  const headings = product.category === 'Calça cargo'
    ? ['Tamanho', 'Cintura (cm)', 'Quadril (cm)', 'Comprimento (cm)']
    : product.category === 'Boné'
      ? ['Tamanho', 'Circunferência (cm)', 'Altura (cm)', 'Aba (cm)']
      : ['Tamanho', 'Largura (cm)', 'Comprimento (cm)', 'Manga (cm)'];
  document.getElementById('measurementHeadings').innerHTML = headings.map((heading) => `<th scope="col">${heading}</th>`).join('');
  document.getElementById('measurementRows').innerHTML = product.measurements.map((row) => `
    <tr>${row.map((value, index) => index === 0 ? `<th scope="row">${value}</th>` : `<td>${value}</td>`).join('')}</tr>
  `).join('');
  document.getElementById('detailReviews').innerHTML = product.reviews.map((review) => `
    <article class="review-item"><div class="review-topline"><strong>${review.name}</strong><time>${review.date}</time></div><div class="review-stars" aria-label="${review.rating} de 5 estrelas">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div><p>${review.text}</p></article>
  `).join('');

  const favoriteButton = document.getElementById('detailFavorite');
  const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  setFavoriteState(favoriteButton, favorites.includes(product.name));
  renderGallery();
}

function getSelectedSize() {
  return sizeOptions.querySelector('input[name="size"]:checked')?.value || product.sizes[0];
}

function addProductToCart() {
  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  const size = getSelectedSize();
  const existing = cart.find((item) => item.name === product.name && item.size === size);
  if (existing) existing.quantity = Number(existing.quantity || 1) + 1;
  else cart.push({ id: `${product.id}-${size}-${Date.now()}`, name: product.name, size, price: product.price, quantity: 1 });
  localStorage.setItem(cartKey, JSON.stringify(cart));
  return size;
}

renderProduct();
gallery.addEventListener('click', (event) => {
  const button = event.target.closest('[data-image-index]');
  if (!button) return;
  activeImage = Number(button.dataset.imageIndex);
  renderGallery();
});
sizeOptions.addEventListener('change', (event) => {
  sizeOptions.querySelectorAll('.size-option').forEach((option) => option.classList.toggle('is-selected', option.contains(event.target)));
});
document.getElementById('detailFavorite').addEventListener('click', (event) => {
  const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  const nextFavorites = favorites.includes(product.name) ? favorites.filter((name) => name !== product.name) : [...favorites, product.name];
  localStorage.setItem(favoritesKey, JSON.stringify(nextFavorites));
  setFavoriteState(event.currentTarget, nextFavorites.includes(product.name));
});
document.getElementById('detailAddCart').addEventListener('click', () => {
  const size = addProductToCart();
  document.getElementById('detailStatus').textContent = `${product.name}, tamanho ${size}, foi adicionado à sacola.`;
});
document.getElementById('detailBuyNow').addEventListener('click', () => {
  addProductToCart();
  document.getElementById('cartToggle')?.click();
});


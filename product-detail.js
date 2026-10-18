const products = window.NEXUS_PRODUCTS;
const params = new URLSearchParams(window.location.search);
const productId = document.body.dataset.productId || params.get('id');
const product = products[productId] || products['graphic-nexus'];
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
    <div class="detail-main-image">
      <img src="${product.images[activeImage]}" alt="${product.name}" />
      <div class="detail-gallery-arrows" aria-label="Navegar pelas imagens do produto">
        <button type="button" data-image-step="-1" aria-label="Imagem anterior">‹</button>
        <button type="button" data-image-step="1" aria-label="Próxima imagem">›</button>
      </div>
    </div>
    <div class="detail-image-counter" id="detailImageCounter" aria-live="polite"></div>
  `;
  updateGalleryImage();
}

function updateGalleryImage() {
  const imageCount = product.images.length;
  const image = gallery.querySelector('.detail-main-image img');
  image.src = product.images[activeImage];
  image.alt = `${product.name} — imagem ${activeImage + 1} de ${imageCount}`;
  gallery.querySelector('#detailImageCounter').textContent = `${activeImage + 1}/${imageCount}`;
  gallery.querySelectorAll('[data-image-step]').forEach((button) => {
    button.disabled = imageCount < 2;
  });
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
  document.getElementById('detailDescriptionCopy').textContent = product.details;
  document.getElementById('detailMaterial').textContent = product.material;
  document.getElementById('detailFit').textContent = product.fit;
  sizeOptions.innerHTML = product.sizes.map((size, index) => `
    <label class="size-option ${index === 0 ? 'is-selected' : ''}"><input type="radio" name="size" value="${size}" ${index === 0 ? 'checked' : ''} /><span>${size}</span></label>
  `).join('');

  const isOneSizeAccessory = ['bone', 'touca'].includes(product.categorySlug);
  const isPants = product.categorySlug === 'calca';
  const headings = isOneSizeAccessory
    ? ['Tamanho']
    : isPants
      ? ['Tamanho', 'Largura das pernas (cm)', 'Comprimento da cintura (cm)', 'Altura (cm)']
      : ['Tamanho', 'Largura (cm)', 'Comprimento (cm)', 'Manga (cm)'];
  const measurements = isOneSizeAccessory
    ? [[product.sizes[0] || 'Único']]
    : product.measurements;
  document.getElementById('measurementHeadings').innerHTML = headings.map((heading) => `<th scope="col">${heading}</th>`).join('');
  document.getElementById('measurementRows').innerHTML = measurements.map((row) => `
    <tr>${row.map((value, index) => index === 0 ? `<th scope="row">${value}</th>` : `<td>${value}</td>`).join('')}</tr>
  `).join('');
  document.querySelector('.table-note').textContent = isOneSizeAccessory
    ? 'Disponível apenas em tamanho único.'
    : 'Medidas aproximadas da peça em centímetros. A variação pode ser de até 2 cm.';
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
  const button = event.target.closest('[data-image-step]');
  if (!button) return;
  activeImage = (activeImage + Number(button.dataset.imageStep) + product.images.length) % product.images.length;
  updateGalleryImage();
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

const products = Object.values(window.NEXUS_PRODUCTS || {});
const categoryLabels = {
  camiseta: 'Camisetas',
  moletom: 'Moletons e blusas',
  jaqueta: 'Jaquetas',
  calca: 'Calças',
  bone: 'Bonés'
};
const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get('categoria') || '';
const categoryTitle = document.getElementById('categoryTitle');
const categoryCount = document.getElementById('categoryCount');
const categoryProducts = document.getElementById('categoryProducts');
const categoryEmpty = document.getElementById('categoryEmpty');
const categoryTabs = document.getElementById('categoryTabs');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const tabs = [
  { slug: '', label: 'Todas' },
  ...Object.entries(categoryLabels).map(([slug, label]) => ({ slug, label }))
];
categoryTabs.innerHTML = tabs.map(({ slug, label }) => `
  <a class="category-tab ${slug === selectedCategory ? 'is-active' : ''}" href="categoria.html${slug ? `?categoria=${slug}` : ''}" ${slug === selectedCategory ? 'aria-current="page"' : ''}>${label}</a>
`).join('');

const matchingProducts = products.filter((product) => !selectedCategory || product.categorySlug === selectedCategory);
const selectedLabel = categoryLabels[selectedCategory] || 'Todas as peças';
categoryTitle.textContent = selectedCategory && !categoryLabels[selectedCategory] ? 'Categoria não encontrada' : selectedLabel;
document.title = `${categoryTitle.textContent} | Nexus Store`;
categoryCount.textContent = `${matchingProducts.length} ${matchingProducts.length === 1 ? 'peça' : 'peças'}`;
categoryEmpty.hidden = matchingProducts.length > 0;
categoryProducts.innerHTML = matchingProducts.map((product) => `
  <article class="product-card category-product-card">
    <div class="product-image">
      <a class="category-product-image" href="produto.html?id=${encodeURIComponent(product.id)}" aria-label="Ver ${product.name}"><img src="${product.images[0]}" alt="${product.name}" /></a>
      <button type="button" class="favorite-btn category-favorite" data-favorite="${product.name}" aria-label="Favoritar ${product.name}" aria-pressed="false">♡</button>
    </div>
    <div class="product-body">
      <div class="product-topline"><span>${product.category}</span><strong>${money.format(product.price)}</strong></div>
      <h2><a href="produto.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h2>
      <p>${product.description}</p>
      <a class="category-view-product" href="produto.html?id=${encodeURIComponent(product.id)}">Ver detalhes</a>
    </div>
  </article>
`).join('');

categoryProducts.addEventListener('click', (event) => {
  const button = event.target.closest('[data-favorite]');
  if (!button) return;
  const name = button.dataset.favorite;
  const favorites = JSON.parse(localStorage.getItem('nexus-favorites') || '[]');
  const nextFavorites = favorites.includes(name) ? favorites.filter((favorite) => favorite !== name) : [...favorites, name];
  localStorage.setItem('nexus-favorites', JSON.stringify(nextFavorites));
  const isFavorite = nextFavorites.includes(name);
  button.classList.toggle('is-favorite', isFavorite);
  button.textContent = isFavorite ? '♥' : '♡';
  button.setAttribute('aria-pressed', String(isFavorite));
});

categoryProducts.querySelectorAll('[data-favorite]').forEach((button) => {
  const isFavorite = JSON.parse(localStorage.getItem('nexus-favorites') || '[]').includes(button.dataset.favorite);
  button.classList.toggle('is-favorite', isFavorite);
  button.textContent = isFavorite ? '♥' : '♡';
});

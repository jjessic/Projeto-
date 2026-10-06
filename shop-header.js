const themeToggle = document.getElementById('themeToggle');
const favoritesToggle = document.getElementById('favoritesToggle');
const cartToggle = document.getElementById('cartToggle');
const shopProducts = Object.values(window.NEXUS_PRODUCTS || {});
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function escapeShopText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function setTheme(theme) {
  document.body.classList.toggle('dark-theme', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
  localStorage.setItem('nexus-theme', theme);
}

function ensureDrawers() {
  if (document.getElementById('shopDrawerBackdrop')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="shop-drawer-backdrop" id="shopDrawerBackdrop" hidden>
      <aside class="shop-drawer" id="shopCartDrawer" aria-label="Carrinho de compras" aria-hidden="true">
        <header class="shop-drawer-header"><div><span>SEU PEDIDO</span><h2>Carrinho</h2></div><button type="button" class="shop-drawer-close" aria-label="Fechar carrinho">×</button></header>
        <div class="shop-drawer-list" id="shopCartList"></div>
        <footer class="shop-drawer-footer" id="shopCartFooter"></footer>
      </aside>
      <aside class="shop-drawer" id="shopFavoritesDrawer" aria-label="Produtos favoritos" aria-hidden="true">
        <header class="shop-drawer-header"><div><span>SUA SELEÇÃO</span><h2>Favoritos</h2></div><button type="button" class="shop-drawer-close" aria-label="Fechar favoritos">×</button></header>
        <div class="shop-drawer-list" id="shopFavoritesList"></div>
      </aside>
    </div>
  `);
}

function updateCounts() {
  const cart = readStore('nexus-cart');
  const favorites = readStore('nexus-favorites');
  document.getElementById('cartCount').textContent = String(cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0));
  document.getElementById('favoritesCount').textContent = String(shopProducts.filter((product) => favorites.includes(product.name)).length);
}

function renderCart() {
  const cart = readStore('nexus-cart');
  const list = document.getElementById('shopCartList');
  const footer = document.getElementById('shopCartFooter');
  if (!cart.length) {
    list.innerHTML = '<p class="shop-drawer-empty">Seu carrinho está vazio.</p>';
    footer.innerHTML = '<button type="button" class="shop-continue-button">Continuar comprando</button>';
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  list.innerHTML = cart.map((item) => {
    const id = encodeURIComponent(String(item.id));
    return `<article class="shop-cart-item"><div><strong>${escapeShopText(item.name)}</strong><small>Tamanho ${escapeShopText(item.size || 'M')}</small><b>${currency.format(Number(item.price || 0) * Number(item.quantity || 1))}</b></div><div class="shop-quantity"><button type="button" data-cart-action="minus" data-cart-id="${id}" aria-label="Diminuir quantidade">−</button><span>${Number(item.quantity || 1)}</span><button type="button" data-cart-action="plus" data-cart-id="${id}" aria-label="Aumentar quantidade">+</button><button type="button" class="shop-remove" data-cart-action="remove" data-cart-id="${id}">Remover</button></div></article>`;
  }).join('');
  footer.innerHTML = `
    <div><span>Subtotal</span><strong>${currency.format(subtotal)}</strong></div>
    <div><span>Desconto PIX (10%)</span><strong id="shopCartDiscount">−${currency.format(subtotal * 0.1)}</strong></div>
    <div><span id="shopDeliverySummary">Entrega</span><strong id="shopDeliveryFee">Selecione</strong></div>
    <div class="shop-total"><span>Total</span><strong id="shopCartTotal">${currency.format(subtotal)}</strong></div>
    <div class="shop-checkout-fields">
      <label>Modalidade de entrega<select id="shopDeliveryOption"><option value="">Carregando opções...</option></select></label>
      <p class="shop-delivery-status" id="shopDeliveryStatus" role="status"></p>
      <div class="shop-address-fields" id="shopAddressFields">
        <label>Rua<input id="shopStreet" autocomplete="street-address" /></label>
        <div class="shop-address-row"><label>Número<input id="shopNumber" /></label><label>CEP<input id="shopCEP" autocomplete="postal-code" /></label></div>
        <label>Complemento<input id="shopComplement" /></label>
      </div>
      <label>Nome para o pedido<input id="shopName" autocomplete="name" /></label>
      <label>Telefone<input id="shopPhone" autocomplete="tel" /></label>
      <label>Pagamento<select id="shopPaymentMethod"><option value="pix">PIX · 10% de desconto</option><option value="cartao">Cartão</option><option value="boleto">Boleto</option></select></label>
      <p class="shop-order-note">O pedido ficará aguardando a confirmação do pagamento. O site não processa pagamentos nesta etapa.</p>
      <p class="shop-order-status" id="shopOrderStatus" role="status" aria-live="polite"></p>
      <button type="button" class="shop-order-button" data-confirm-order>Registrar pedido</button>
    </div>
    <button type="button" class="shop-continue-button">Continuar comprando</button>`;

  const deliverySelect = document.getElementById('shopDeliveryOption');
  const updateTotals = () => {
    const selected = (window.NEXUS_DELIVERY_OPTIONS || []).find((option) => option.id === deliverySelect.value);
    const fee = Number(selected?.fee || 0);
    const pix = document.getElementById('shopPaymentMethod').value === 'pix';
    const discount = pix ? subtotal * 0.1 : 0;
    document.getElementById('shopCartDiscount').textContent = `−${currency.format(discount)}`;
    document.getElementById('shopDeliveryFee').textContent = selected ? currency.format(fee) : 'Selecione';
    document.getElementById('shopDeliverySummary').textContent = selected ? `${selected.name} · ${selected.estimate}` : 'Entrega';
    document.getElementById('shopCartTotal').textContent = currency.format(subtotal - discount + fee);
    document.getElementById('shopAddressFields').hidden = !selected?.requires_address;
  };
  deliverySelect.addEventListener('change', updateTotals);
  document.getElementById('shopPaymentMethod').addEventListener('change', updateTotals);
  window.NexusStoreAccount?.ready.then(() => {
    const options = window.NEXUS_DELIVERY_OPTIONS || [];
    deliverySelect.innerHTML = options.map((option) =>
      `<option value="${escapeShopText(option.id)}">${escapeShopText(option.name)} · ${currency.format(option.fee)} · ${escapeShopText(option.estimate)}</option>`).join('');
    deliverySelect.disabled = options.length === 0;
    if (!options.length) document.getElementById('shopDeliveryStatus').textContent = 'Configure a conexão com o banco para carregar as modalidades.';
    updateTotals();
  });
}

function renderFavorites() {
  const favorites = readStore('nexus-favorites');
  const savedProducts = shopProducts.filter((product) => favorites.includes(product.name));
  const list = document.getElementById('shopFavoritesList');
  list.innerHTML = savedProducts.length
    ? savedProducts.map((product) => `<a class="shop-favorite-item" href="produto.html?id=${encodeURIComponent(product.id)}"><img src="${product.images[0]}" alt="" /><span><strong>${product.name}</strong><small>${currency.format(product.price)}</small></span><span aria-hidden="true">›</span></a>`).join('')
    : '<p class="shop-drawer-empty">Você ainda não favoritou nenhuma peça.</p>';
}

function closeDrawers() {
  const backdrop = document.getElementById('shopDrawerBackdrop');
  backdrop.hidden = true;
  backdrop.classList.remove('is-open');
  document.querySelectorAll('.shop-drawer').forEach((drawer) => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  });
  cartToggle.setAttribute('aria-expanded', 'false');
  favoritesToggle.setAttribute('aria-expanded', 'false');
}

function openDrawer(kind) {
  const backdrop = document.getElementById('shopDrawerBackdrop');
  const isCart = kind === 'cart';
  const drawer = document.getElementById(isCart ? 'shopCartDrawer' : 'shopFavoritesDrawer');
  closeDrawers();
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    backdrop.classList.add('is-open');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  });
  (isCart ? cartToggle : favoritesToggle).setAttribute('aria-expanded', 'true');
  if (isCart) renderCart();
  else renderFavorites();
  drawer.querySelector('.shop-drawer-close').focus();
}

setTheme(localStorage.getItem('nexus-theme') || 'light');
ensureDrawers();
updateCounts();

themeToggle.addEventListener('click', () => setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));
cartToggle.addEventListener('click', () => openDrawer('cart'));
favoritesToggle.addEventListener('click', () => openDrawer('favorites'));
document.addEventListener('click', (event) => {
  const closeButton = event.target.closest('.shop-drawer-close, .shop-continue-button');
  if (closeButton || event.target.id === 'shopDrawerBackdrop') closeDrawers();

  const actionButton = event.target.closest('[data-cart-action]');
  if (actionButton) {
    const id = decodeURIComponent(actionButton.dataset.cartId);
    let cart = readStore('nexus-cart');
    const item = cart.find((entry) => String(entry.id) === id);
    if (!item) return;
    if (actionButton.dataset.cartAction === 'remove') cart = cart.filter((entry) => String(entry.id) !== id);
    else item.quantity = Math.max(0, Number(item.quantity || 1) + (actionButton.dataset.cartAction === 'plus' ? 1 : -1));
    cart = cart.filter((entry) => Number(entry.quantity || 1) > 0);
    localStorage.setItem('nexus-cart', JSON.stringify(cart));
    renderCart();
    updateCounts();
  }

  if (event.target.closest('.favorite-btn, #detailFavorite')) {
    requestAnimationFrame(() => {
      updateCounts();
      if (document.getElementById('shopFavoritesDrawer').classList.contains('is-open')) renderFavorites();
    });
  }

  if (event.target.closest('#detailAddCart, #detailBuyNow')) requestAnimationFrame(updateCounts);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDrawers();
});
window.addEventListener('storage', (event) => {
  if (event.key === 'nexus-cart' || event.key === 'nexus-favorites' || event.key === null) {
    updateCounts();
    renderCart();
    renderFavorites();
  }
});
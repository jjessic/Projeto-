const form = document.getElementById('fitForm');
const resetBtn = document.getElementById('resetBtn');
const vampiraMsg = document.getElementById('vampiraMsg');
const tamanhoResult = document.getElementById('tamanhoResult');
const descricaoResult = document.getElementById('descricaoResult');
const tipsList = document.getElementById('tipsList');
const cartCount = document.getElementById('cartCount');
const addCartButtons = document.querySelectorAll('.add-cart-btn');
const cartToggle = document.getElementById('cartToggle');
const cartPanel = document.getElementById('cartPanel');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const cartDiscount = document.getElementById('cartDiscount');
const cartFinalTotal = document.getElementById('cartFinalTotal');
const cartDelivery = document.getElementById('cartDelivery');
const cartCheckout = document.querySelector('.cart-checkout');
const paymentOptions = document.querySelectorAll('.payment-option');
const customerName = document.getElementById('customerName');
const customerStreet = document.getElementById('customerStreet');
const customerNumber = document.getElementById('customerNumber');
const customerComplement = document.getElementById('customerComplement');
const customerCEP = document.getElementById('customerCEP');
const installmentBox = document.getElementById('installmentBox');
const installmentSelect = document.getElementById('installmentSelect');
const themeToggle = document.getElementById('themeToggle');
const favoritesToggle = document.getElementById('favoritesToggle');
const favoritesPanel = document.getElementById('favoritesPanel');
const closeFavoritesBtn = document.getElementById('closeFavoritesBtn');
const favoritesList = document.getElementById('favoritesList');
const favoritesCount = document.getElementById('favoritesCount');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const heroSlides = document.querySelectorAll('.hero-slide');
const slideCurrent = document.getElementById('slideCurrent');
const previousSlideButton = document.getElementById('prevSlide');
const nextSlideButton = document.getElementById('nextSlide');
const categoriesToggle = document.getElementById('categoriesToggle');
const categoryMenu = document.getElementById('categoryMenu');

let cartItems = 0;
let cartProducts = JSON.parse(localStorage.getItem('nexus-cart') || '[]');
let selectedPaymentMethod = 'pix';
const AUTO_DISCOUNT_PERCENT = 0.10;
const DELIVERY_PRICE = 24.9;

function setTheme(theme) {
  document.body.classList.toggle('dark-theme', theme === 'dark');
  if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
  localStorage.setItem('nexus-theme', theme);
}

setTheme(localStorage.getItem('nexus-theme') || 'light');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
  });
}

let activeSlide = 0;
function showSlide(index) {
  if (!heroSlides.length) return;
  activeSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === activeSlide));
  if (slideCurrent) slideCurrent.textContent = String(activeSlide + 1).padStart(2, '0');
}

if (previousSlideButton) previousSlideButton.addEventListener('click', () => showSlide(activeSlide - 1));
if (nextSlideButton) nextSlideButton.addEventListener('click', () => showSlide(activeSlide + 1));

if (categoriesToggle && categoryMenu) {
  categoriesToggle.addEventListener('click', () => {
    const isOpen = categoriesToggle.getAttribute('aria-expanded') === 'true';
    categoriesToggle.setAttribute('aria-expanded', String(!isOpen));
    categoryMenu.hidden = isOpen;
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('.category-menu')) return;
    categoriesToggle.setAttribute('aria-expanded', 'false');
    categoryMenu.hidden = true;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    categoriesToggle.setAttribute('aria-expanded', 'false');
    categoryMenu.hidden = true;
  });
}

if (heroSlides.length > 1) {
  setInterval(() => showSlide(activeSlide + 1), 4000);
}

const productCards = Array.from(document.querySelectorAll('.product-card'));
const favoriteButtons = document.querySelectorAll('.favorite-btn');
const savedFavorites = JSON.parse(localStorage.getItem('nexus-favorites') || '[]');
productCards.forEach((card) => {
  const productId = card.dataset.productId;
  const product = window.NEXUS_PRODUCTS?.[productId];
  if (!product) return;
  const detailUrl = `produto.html?id=${encodeURIComponent(productId)}`;
  const image = card.querySelector('.product-image img');
  const imageLink = document.createElement('a');
  imageLink.className = 'product-detail-link';
  imageLink.href = detailUrl;
  imageLink.setAttribute('aria-label', `Ver detalhes de ${product.name}`);
  image.replaceWith(imageLink);
  imageLink.append(image);

  const title = card.querySelector('h4');
  const titleLink = document.createElement('a');
  titleLink.className = 'product-title-link';
  titleLink.href = detailUrl;
  titleLink.textContent = product.name;
  title.replaceChildren(titleLink);
});
const productNames = productCards.map((card) => ({
  name: card.querySelector('h4')?.textContent.trim() || '',
  card,
}));
const categoryLinks = document.querySelectorAll('[data-category-filter]');

function getSavedFavorites() {
  return JSON.parse(localStorage.getItem('nexus-favorites') || '[]');
}

function renderFavorites() {
  const favorites = getSavedFavorites();
  const favoriteProducts = productNames.filter(({ name }) => favorites.includes(name));

  if (favoritesCount) favoritesCount.textContent = String(favoriteProducts.length);
  if (!favoritesList) return;

  favoritesList.innerHTML = favoriteProducts.length
    ? favoriteProducts.map(({ name, card }) => `
      <button type="button" class="favorite-item" data-favorite-link="${name}">
        <span class="favorite-item-image"><img src="${card.querySelector('img')?.getAttribute('src') || ''}" alt="" /></span>
        <span><strong>${name}</strong><small>${card.querySelector('.product-topline span')?.textContent || 'NEXUS'}</small></span>
        <span class="favorite-item-arrow">›</span>
      </button>
    `).join('')
    : '<p class="cart-empty">Você ainda não favoritou nenhuma peça.</p>';
}

function updateFavoriteButton(button, isFavorite) {
  button.classList.toggle('is-favorite', isFavorite);
  button.textContent = isFavorite ? '♥' : '♡';
  button.setAttribute('aria-pressed', String(isFavorite));
}

favoriteButtons.forEach((button) => {
  const productName = button.dataset.favoriteProduct;
  updateFavoriteButton(button, savedFavorites.includes(productName));
  button.addEventListener('click', () => {
    const isFavorite = !button.classList.contains('is-favorite');
    const favorites = JSON.parse(localStorage.getItem('nexus-favorites') || '[]');
    const nextFavorites = isFavorite
      ? [...new Set([...favorites, productName])]
      : favorites.filter((favorite) => favorite !== productName);
    localStorage.setItem('nexus-favorites', JSON.stringify(nextFavorites));
    updateFavoriteButton(button, isFavorite);
    renderFavorites();
  });
});

renderFavorites();

if (favoritesToggle && favoritesPanel) {
  favoritesToggle.addEventListener('click', () => {
    renderFavorites();
    favoritesPanel.classList.toggle('open');
    cartPanel?.classList.remove('open');
  });
}

if (closeFavoritesBtn && favoritesPanel) {
  closeFavoritesBtn.addEventListener('click', () => favoritesPanel.classList.remove('open'));
}

if (favoritesList) {
  favoritesList.addEventListener('click', (event) => {
    const item = event.target.closest('[data-favorite-link]');
    if (!item) return;
    const product = productNames.find(({ name }) => name === item.dataset.favoriteLink);
    if (!product) return;
    product.card.hidden = false;
    favoritesPanel?.classList.remove('open');
    product.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function filterProducts(query) {
  productNames.forEach(({ card }) => {
    card.hidden = Boolean(query) && !card.textContent.toLowerCase().includes(query);
  });
}

categoryLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const category = link.dataset.categoryFilter || '';
    if (searchInput) searchInput.value = '';
    if (searchSuggestions) searchSuggestions.hidden = true;
    filterProducts(category);
  });
});

function renderSearchSuggestions(query) {
  if (!searchSuggestions) return;
  const matches = query
    ? productNames.filter(({ name }) => name.toLowerCase().includes(query)).slice(0, 4)
    : [];

  searchSuggestions.innerHTML = matches
    .map(({ name }) => `<li><button type="button" data-product-search="${name}">${name}</button></li>`)
    .join('');
  searchSuggestions.hidden = matches.length === 0;
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    filterProducts(query);
    renderSearchSuggestions(query);
  });

  searchInput.addEventListener('focus', () => {
    renderSearchSuggestions(searchInput.value.trim().toLowerCase());
  });
}

if (searchSuggestions) {
  searchSuggestions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-product-search]');
    if (!button || !searchInput) return;
    searchInput.value = button.dataset.productSearch;
    filterProducts(searchInput.value.toLowerCase());
    searchSuggestions.hidden = true;
    document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.addEventListener('click', (event) => {
  if (searchSuggestions && !event.target.closest('.search-box')) searchSuggestions.hidden = true;
});

function calcularTamanho({ peito, cintura, quadril, ombro, peso, altura, fitStyle, tipoPeca }) {
  const topSizes = ['P', 'M', 'G', 'GG'];
  const pantsSizes = ['34', '36', '38', '40', '42', '44', '46', '48'];
  const fitIndex = fitStyle === 'oversized' ? 1 : fitStyle === 'slim' ? -1 : 0;

  if (tipoPeca === 'bone') {
    return { tamanho: 'U', descricao: 'Este modelo tem tamanho único e ajuste regulável.', mensagem: 'Compare a circunferência da cabeça com a medida informada na tabela do boné.' };
  }

  if (tipoPeca === 'calca') {
    const waistSize = cintura < 68 ? 0 : cintura < 72 ? 1 : cintura < 76 ? 2 : cintura < 80 ? 3 : cintura < 84 ? 4 : cintura < 88 ? 5 : cintura < 92 ? 6 : 7;
    let sizeIndex = Math.max(0, Math.min(pantsSizes.length - 1, waistSize + fitIndex));
    if (quadril && quadril >= 112) sizeIndex = Math.min(pantsSizes.length - 1, sizeIndex + 1);
    return { tamanho: pantsSizes[sizeIndex], descricao: 'Estimativa pela cintura' + (quadril ? ' e pelo quadril' : '') + '. Compare com a tabela da peça.', mensagem: 'Esse tamanho é uma estimativa. Confira cintura e quadril na tabela antes de comprar.' };
  }

  const measurements = [peito, cintura, quadril, ombro].filter((value) => Number.isFinite(value) && value > 0);
  const largestMeasure = Math.max(...measurements);
  let sizeIndex = largestMeasure < 90 ? 0 : largestMeasure < 100 ? 1 : largestMeasure < 110 ? 2 : 3;
  sizeIndex = Math.max(0, Math.min(topSizes.length - 1, sizeIndex + fitIndex));
  if (altura && altura >= 190) sizeIndex = Math.min(topSizes.length - 1, sizeIndex + 1);
  if (peso && peso >= 100) sizeIndex = Math.min(topSizes.length - 1, sizeIndex + 1);

  const pieceName = { camiseta: 'Camiseta', blusa: 'Blusa', moletom: 'Moletom', jaqueta: 'Jaqueta' }[tipoPeca] || 'Peça';
  const extraMeasure = cintura || quadril || ombro;
  return {
    tamanho: topSizes[sizeIndex],
    descricao: `Estimativa para ${pieceName.toLowerCase()}${extraMeasure ? ' considerando as medidas informadas' : ' pelo busto/peito'}. Compare com a tabela da peça.`,
    mensagem: `Pelas medidas informadas, sugerimos o tamanho ${topSizes[sizeIndex]} para sua ${pieceName.toLowerCase()}.`
  };
}

function updateFitRequirement() {
  const type = document.getElementById('tipoPeca').value;
  const bust = document.getElementById('busto');
  const waist = document.getElementById('cintura');
  const head = document.getElementById('cabeca');
  bust.required = !['calca', 'bone'].includes(type);
  waist.required = type === 'calca';
  head.required = type === 'bone';

  const hintByType = {
    camiseta: 'Para camiseta, informe o busto/peito. As outras medidas são opcionais.',
    blusa: 'Para blusa, informe o busto/peito. As outras medidas são opcionais.',
    moletom: 'Para moletom, informe o busto/peito. As outras medidas são opcionais.',
    jaqueta: 'Para jaqueta, informe o busto/peito. Cintura, quadril, peso e altura são opcionais.',
    calca: 'Para calça, informe a cintura. Quadril, peso e altura ajudam a refinar, mas são opcionais.',
    bone: 'Para boné, informe a circunferência da cabeça.'
  };
  document.getElementById('fitMeasurementHint').textContent = hintByType[type];

}

function handleSubmit(event) {
  event.preventDefault();

  const type = document.getElementById('tipoPeca').value;
  const data = {
    peito: Number(document.getElementById('busto').value) || null,
    cintura: Number(document.getElementById('cintura').value) || null,
    quadril: Number(document.getElementById('quadril').value) || null,
    ombro: Number(document.getElementById('ombro').value) || null,
    cabeca: Number(document.getElementById('cabeca').value) || null,
    altura: Number(document.getElementById('altura').value) || null,
    peso: Number(document.getElementById('peso').value) || null,
    fitStyle: document.getElementById('fitStyle').value,
    tipoPeca: type,
  };

  const resultado = calcularTamanho(data);
  tamanhoResult.textContent = resultado.tamanho;
  descricaoResult.textContent = resultado.descricao;
  vampiraMsg.textContent = resultado.mensagem;
  const tips = {
    calca: ['• A cintura define a primeira estimativa.', '• O quadril é opcional e ajuda a escolher o caimento.', '• Compare as medidas com a tabela da calça.'],
    bone: ['• Meça ao redor da cabeça, acima das sobrancelhas.', '• O tamanho único tem ajuste regulável.', '• Confira a faixa de circunferência na tabela.']
  }[type] || ['• Busto/peito é a medida principal desta peça.', '• Altura, peso, cintura, quadril e ombro são opcionais.', '• Compare a sugestão com a tabela do produto.'];
  tipsList.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join('');
}

function resetForm() {
  document.getElementById('fitForm').reset();
  document.getElementById('busto').value = '';
  document.getElementById('cintura').value = '';
  document.getElementById('quadril').value = '';
  document.getElementById('ombro').value = '';
  document.getElementById('cabeca').value = '';
  document.getElementById('altura').value = '';
  document.getElementById('peso').value = '';
  document.getElementById('fitStyle').value = 'regular';
  document.getElementById('tipoPeca').value = 'camiseta';
  updateFitRequirement();
  tamanhoResult.textContent = '—';
  descricaoResult.textContent = 'As outras medidas podem ficar em branco.';
  vampiraMsg.textContent = 'Informe o busto para encontrar seu tamanho de camiseta.';
  tipsList.innerHTML = '<li>• Selecione a peça que quer comprar.</li><li>• Preencha a medida principal indicada.</li><li>• Adicione outras medidas para refinar.</li>';
}

form.addEventListener('submit', handleSubmit);
resetBtn.addEventListener('click', resetForm);
document.getElementById('tipoPeca').addEventListener('change', updateFitRequirement);
updateFitRequirement();

const productViewer = document.getElementById('productViewer');
const openShirtBtn = document.getElementById('openShirtBtn');
const rotateShirtBtn = document.getElementById('rotateShirtBtn');

if (productViewer && openShirtBtn) {
  openShirtBtn.addEventListener('click', () => {
    productViewer.classList.toggle('is-open');
    productViewer.classList.remove('is-rotating');
  });
}

if (productViewer && rotateShirtBtn) {
  rotateShirtBtn.addEventListener('click', () => {
    productViewer.classList.remove('is-rotating');
    void productViewer.offsetWidth;
    productViewer.classList.add('is-rotating');
    setTimeout(() => productViewer.classList.remove('is-rotating'), 900);
  });
}

const assistantWidget = document.getElementById('assistantWidget');
const assistantToggle = document.getElementById('assistantToggle');
const closeAssistant = document.getElementById('closeAssistant');
const minimizeAssistant = document.getElementById('minimizeAssistant');
const maximizeAssistant = document.getElementById('maximizeAssistant');
const assistantResponse = document.getElementById('assistantResponse');
const assistantSelectedQuestion = document.getElementById('assistantSelectedQuestion');
const assistantQuickReplies = document.getElementById('assistantQuickReplies');
const assistantQuickLabel = document.getElementById('assistantQuickLabel');
const assistantFollowup = document.getElementById('assistantFollowup');
const assistantFollowupOptions = document.getElementById('assistantFollowupOptions');
const assistantFeedback = document.getElementById('assistantFeedback');
const assistantContact = document.getElementById('assistantContact');
const assistantRestart = document.getElementById('assistantRestart');

const assistantFaqs = {
  delivery: {
    followups: [
      { label: 'Quero saber o prazo para o meu CEP', answer: 'O prazo varia conforme o CEP e a transportadora. Como a loja não calcula essa previsão automaticamente, envie seu CEP pelo WhatsApp ou e-mail antes de concluir a compra. A equipe confirmará a estimativa em dias úteis para sua região.' },
      { label: 'Quando o frete é grátis?', answer: 'O frete é grátis a partir de R$ 300 em compras. Em pedidos abaixo desse valor, o frete custa R$ 24,90.' }
    ]
  },
  payments: {
    followups: [
      { label: 'Quais formas de pagamento são aceitas?', answer: 'A loja aceita PIX, cartão de crédito e boleto bancário. O PIX recebe 10% de desconto, o cartão pode ser parcelado em até 12 vezes e o boleto é pago à vista. Selecione a forma desejada no carrinho antes de finalizar.' },
      { label: 'Como funciona o desconto no PIX?', answer: 'Ao selecionar PIX, o carrinho aplica 10% de desconto sobre o valor dos produtos. O total atualizado aparece no resumo antes de finalizar o pedido.' },
      { label: 'Como consulto as parcelas do cartão?', answer: 'No carrinho, selecione Cartão e escolha o número de parcelas. O sistema apresenta o valor de cada parcela, com opções de até 12 vezes.' }
    ]
  },
  cancel: {
    followups: [
      { label: 'O pedido ainda não foi enviado', answer: 'Entre em contato com a equipe pelo WhatsApp ou e-mail e informe o número do pedido. Se o processamento ou envio ainda não tiver começado, a equipe verificará se é possível interrompê-lo e confirmará o cancelamento e o reembolso.' },
      { label: 'O pedido já foi enviado', answer: 'Depois que o pedido é despachado, o cancelamento pode não ser mais possível. Entre em contato com a equipe antes de recusar a entrega ou devolver o pacote; ela informará o procedimento adequado para o seu caso.' }
    ]
  },
  exchange: {
    followups: [
      { label: 'Quero trocar o tamanho', answer: 'Para solicitar uma troca, entre em contato em até 7 dias corridos após o recebimento e informe o número do pedido, a peça e o tamanho desejado. A troca depende da disponibilidade em estoque. A equipe confirmará a disponibilidade e enviará as instruções de postagem; aguarde essas orientações antes de despachar o produto.' },
      { label: 'Quero devolver a compra', answer: 'Em compras feitas pela internet, você pode solicitar a devolução por arrependimento em até 7 dias corridos após o recebimento, conforme o direito previsto no Código de Defesa do Consumidor. Informe o número do pedido pelo WhatsApp ou e-mail para receber as instruções de postagem e reembolso. Aguarde as orientações antes de enviar o produto.' },
      { label: 'A peça chegou com defeito', answer: 'Entre em contato com a equipe e informe o número do pedido. Descreva o defeito e envie fotos da peça e da embalagem. A equipe avaliará o caso e explicará a solução e os próximos passos aplicáveis. Preserve o produto e aguarde as instruções antes de enviá-lo.' }
    ]
  },
  tracking: {
    followups: [
      { label: 'Não recebi a confirmação do pedido', answer: 'Verifique a caixa de entrada e a pasta de spam do e-mail utilizado na compra. Se não localizar a confirmação, envie seu nome completo e e-mail pelo WhatsApp ou e-mail da loja para a equipe localizar o pedido.' },
      { label: 'O prazo de entrega já passou', answer: 'Envie o número do pedido e o CEP de entrega pelo WhatsApp ou e-mail. A equipe consultará a transportadora e informará a situação e a nova previsão de entrega.' }
    ]
  }
};
let activeAssistantFaq = '';

function resetAssistantFaq(message = 'Olá! Eu sou o X Store. Posso ajudar com informações sobre tamanhos, pedidos, entrega, pagamentos e trocas. O que você gostaria de saber?') {
  activeAssistantFaq = '';
  assistantResponse.textContent = message;
  assistantResponse.hidden = false;
  assistantSelectedQuestion.textContent = '';
  assistantSelectedQuestion.hidden = true;
  assistantQuickReplies.hidden = false;
  assistantQuickLabel.hidden = false;
  assistantFollowup.hidden = true;
  assistantFeedback.hidden = true;
  assistantContact.hidden = true;
  assistantRestart.hidden = true;
}

function showAssistantFollowups(question, followups = []) {
  assistantSelectedQuestion.textContent = question;
  assistantSelectedQuestion.hidden = false;
  assistantResponse.hidden = true;
  assistantQuickReplies.hidden = true;
  assistantQuickLabel.hidden = true;
  assistantFollowup.hidden = false;
  assistantFeedback.hidden = true;
  assistantContact.hidden = true;
  assistantRestart.hidden = false;
  assistantFollowupOptions.innerHTML = followups.map((item, index) => `
    <button type="button" data-followup-index="${index}">${item.label}</button>
  `).join('');
}

document.getElementById('assistantWidget').addEventListener('click', (event) => {
  const faqButton = event.target.closest('[data-faq]');
  if (faqButton) {
    if (faqButton.dataset.faq === 'size') {
      assistantWidget.classList.add('closed');
      assistantToggle.style.display = 'block';
      document.getElementById('fit-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.location.hash = 'fit-box';
      return;
    }
    if (faqButton.dataset.faq === 'contact') {
      assistantSelectedQuestion.textContent = faqButton.textContent.trim();
      assistantSelectedQuestion.hidden = false;
      assistantResponse.textContent = 'Você pode falar com a equipe pelos canais abaixo. O horário de atendimento é das 10h às 22h. Se pretende visitar o endereço, confirme antes se há atendimento presencial.';
      assistantResponse.hidden = false;
      assistantQuickReplies.hidden = true;
      assistantQuickLabel.hidden = true;
      assistantFollowup.hidden = true;
      assistantFeedback.hidden = false;
      assistantContact.hidden = false;
      assistantRestart.hidden = false;
      return;
    }
    const faq = assistantFaqs[faqButton.dataset.faq];
    if (faq) {
      activeAssistantFaq = faqButton.dataset.faq;
      showAssistantFollowups(faqButton.textContent.trim(), faq.followups);
    }
    return;
  }

  const followupButton = event.target.closest('[data-followup-index]');
  if (followupButton) {
    const faq = assistantFaqs[activeAssistantFaq];
    const followup = faq?.followups[Number(followupButton.dataset.followupIndex)];
    if (followup) {
      assistantSelectedQuestion.textContent = `${assistantSelectedQuestion.textContent}\n${followup.label}`;
      assistantResponse.hidden = false;
      assistantResponse.textContent = followup.answer;
      assistantFollowup.hidden = true;
      assistantFeedback.hidden = false;
    }
    return;
  }

  const feedbackButton = event.target.closest('[data-feedback]');
  if (feedbackButton) {
    if (feedbackButton.dataset.feedback === 'yes') {
      resetAssistantFaq('Obrigado pela confirmação. Se surgir outra dúvida, estarei por aqui para ajudar.');
    } else {
      assistantResponse.textContent = 'Entendo. Entre em contato com a equipe e informe o número do pedido e os detalhes da solicitação para receber atendimento.';
      assistantQuickReplies.hidden = true;
      assistantFollowup.hidden = true;
      assistantFeedback.hidden = true;
      assistantContact.hidden = false;
      assistantRestart.hidden = false;
    }
    return;
  }

  if (event.target.closest('#assistantRestart')) resetAssistantFaq();
});

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getSubtotal() {
  return cartProducts.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
}

function updateInstallmentOptions() {
  if (!installmentSelect) return;
  
  const subtotal = getSubtotal();
  const discount = subtotal * AUTO_DISCOUNT_PERCENT;
  const delivery = subtotal >= 300 ? 0 : DELIVERY_PRICE;
  const finalTotal = subtotal - discount + delivery;

  const options = installmentSelect.querySelectorAll('option');
  options.forEach((option, index) => {
    if (index === 0) {
      option.textContent = `À vista (sem juros)`;
    } else {
      const installments = parseInt(option.value);
      const installmentValue = finalTotal / installments;
      option.textContent = `${installments}x de ${formatCurrency(installmentValue)}`;
    }
  });
}

function renderCart() {
  if (!cartList || !cartTotal || !cartDiscount || !cartFinalTotal || !cartDelivery) return;

  if (cartProducts.length === 0) {
    cartList.innerHTML = '<p class="cart-empty">Seu carrinho está vazio.</p>';
    cartTotal.textContent = 'R$ 0,00';
    cartDiscount.textContent = '-R$ 0,00';
    cartDelivery.textContent = 'R$ 0,00';
    cartFinalTotal.textContent = 'R$ 0,00';
    return;
  }

  const subtotal = getSubtotal();
  const discount = subtotal * AUTO_DISCOUNT_PERCENT;
  const delivery = subtotal >= 300 ? 0 : DELIVERY_PRICE;
  const finalTotal = subtotal - discount + delivery;

  cartList.innerHTML = cartProducts.map((item) => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <small>Tamanho ${item.size}</small>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-box">
          <button type="button" class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
          <strong>${item.quantity || 1}</strong>
          <button type="button" class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
        </div>
        <span>${formatCurrency(Number(item.price) * (item.quantity || 1))}</span>
        <button type="button" class="remove-cart-item" data-id="${item.id}">Remover</button>
      </div>
    </div>
  `).join('');

  cartTotal.textContent = formatCurrency(subtotal);
  cartDiscount.textContent = `-${formatCurrency(discount)}`;
  cartDelivery.textContent = formatCurrency(delivery);
  cartFinalTotal.textContent = formatCurrency(finalTotal);
  updateInstallmentOptions();
}

function updateCartCount() {
  const totalQuantity = cartProducts.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  cartItems = totalQuantity;
  localStorage.setItem('nexus-cart', JSON.stringify(cartProducts));
  if (cartCount) {
    cartCount.textContent = String(totalQuantity);
  }
  renderCart();
}

function openAssistant() {
  assistantWidget.classList.remove('closed');
  assistantWidget.classList.remove('minimized');
  assistantToggle.style.display = 'none';
}

function closeAssistantPanel() {
  assistantWidget.classList.add('closed');
  assistantToggle.style.display = 'block';
}

function toggleMinimize() {
  assistantWidget.classList.toggle('minimized');
  assistantWidget.classList.remove('maximized');
}

function toggleMaximize() {
  assistantWidget.classList.toggle('maximized');
  assistantWidget.classList.remove('minimized');
}

assistantToggle.addEventListener('click', openAssistant);
closeAssistant.addEventListener('click', closeAssistantPanel);
minimizeAssistant.addEventListener('click', toggleMinimize);
maximizeAssistant.addEventListener('click', toggleMaximize);

addCartButtons.forEach((button) => {
  button.addEventListener('click', () => {
    cartItems += 1;
    const productName = button.dataset.product || 'Produto';
    const productId = button.closest('.product-card')?.dataset.productId;
    const selectedSize = window.NEXUS_PRODUCTS?.[productId]?.sizes?.[0] || 'M';
    const price = Number(button.dataset.price || 0);
    cartProducts.push({ id: `${productName}-${selectedSize}-${Date.now()}`, name: productName, size: selectedSize, price });
    cartItems = cartProducts.length;
    updateCartCount();
    if (cartPanel) {
      cartPanel.classList.add('open');
    }
  });
});

if (cartToggle) {
  cartToggle.addEventListener('click', () => {
    if (cartPanel) {
      cartPanel.classList.toggle('open');
    }
  });
}

if (closeCartBtn && cartPanel) {
  closeCartBtn.addEventListener('click', () => {
    cartPanel.classList.remove('open');
  });
}

if (cartList) {
  cartList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.remove-cart-item');
    if (removeButton) {
      const idToRemove = removeButton.dataset.id;
      cartProducts = cartProducts.filter((item) => item.id !== idToRemove);
      updateCartCount();

      return;
    }

    const qtyButton = event.target.closest('.qty-btn');
    if (!qtyButton) return;

    const itemId = qtyButton.dataset.id;
    const action = qtyButton.dataset.action;
    const item = cartProducts.find((entry) => entry.id === itemId);
    if (!item) return;

    if (action === 'plus') {
      item.quantity = Number(item.quantity || 1) + 1;
    }

    if (action === 'minus') {
      item.quantity = Number(item.quantity || 1) - 1;
      if (item.quantity <= 0) {
        cartProducts = cartProducts.filter((entry) => entry.id !== itemId);
      }
    }

    updateCartCount();
  });
}

if (paymentOptions) {
  paymentOptions.forEach((option) => {
    option.addEventListener('click', () => {
      paymentOptions.forEach((item) => item.classList.toggle('active', item === option));
      selectedPaymentMethod = option.dataset.method || 'pix';
      
      if (installmentBox) {
        installmentBox.style.display = selectedPaymentMethod === 'cartao' ? 'block' : 'none';
      }
      
    });
  });
}

if (cartCheckout) {
  cartCheckout.addEventListener('click', () => {
    if (cartProducts.length === 0) {
      return;
    }

    const nameVal = customerName && customerName.value.trim() ? customerName.value.trim() : '';
    const streetVal = customerStreet && customerStreet.value.trim() ? customerStreet.value.trim() : '';
    const numberVal = customerNumber && customerNumber.value.trim() ? customerNumber.value.trim() : '';
    const cepVal = customerCEP && customerCEP.value.trim() ? customerCEP.value.trim() : '';

    if (!nameVal || !streetVal || !numberVal || !cepVal) {
      return;
    }

    const paymentName = selectedPaymentMethod === 'pix' ? 'PIX' : selectedPaymentMethod === 'cartao' ? 'Cartão' : 'Boleto';
    const complementVal = customerComplement && customerComplement.value.trim() ? `, ${customerComplement.value.trim()}` : '';
    const fullAddress = `${streetVal}, ${numberVal}${complementVal}`;
    
    const subtotal = getSubtotal();
    const discount = subtotal * AUTO_DISCOUNT_PERCENT;
    const delivery = subtotal >= 300 ? 0 : DELIVERY_PRICE;
    const finalTotal = subtotal - discount + delivery;

    setTimeout(() => {
      if (cartPanel) {
        cartPanel.classList.remove('open');
      }
      cartProducts = [];
      if (customerName) customerName.value = '';
      if (customerStreet) customerStreet.value = '';
      if (customerNumber) customerNumber.value = '';
      if (customerComplement) customerComplement.value = '';
      if (customerCEP) customerCEP.value = '';
      updateCartCount();
    }, 2500);
  });
}

assistantToggle.style.display = 'block';
updateCartCount();

if (sessionStorage.getItem('nexus-open-cart') === 'true') {
  cartPanel?.classList.add('open');
  sessionStorage.removeItem('nexus-open-cart');
}

if (new URLSearchParams(window.location.search).has('abrir-carrinho')) {
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
}

document.addEventListener('DOMContentLoaded', () => {
  const widget = document.getElementById('assistantWidget');
  const toggle = document.getElementById('assistantToggle');
  const closeBtn = document.getElementById('closeAssistant');
  
  widget.classList.add('closed');

  toggle.onclick = () => widget.classList.remove('closed');
  closeBtn.onclick = () => widget.classList.add('closed');
  
  document.getElementById('minimizeAssistant').onclick = () => {
    widget.classList.toggle('minimized');
  };
  document.getElementById('maximizeAssistant').onclick = () => {
    widget.classList.toggle('maximized');
  };
});
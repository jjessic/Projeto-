(() => {
  const config = window.NEXUS_STORE_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const accountPage = document.body.classList.contains('account-page');
  const configMissingMessage = 'O cadastro não está disponível no momento. Tente novamente mais tarde.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let currentUser = null;
  let readyResolve;
  const ready = new Promise((resolve) => { readyResolve = resolve; });

  function message(element, text, isError = true) {
    if (!element) return;
    element.textContent = text;
    element.classList.toggle('is-success', !isError);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }

  function persistShoppingState(user = currentUser) {
    if (!user) return;
    localStorage.setItem(`nexus-cart:${user.id}`, localStorage.getItem('nexus-cart') || '[]');
    localStorage.setItem(`nexus-favorites:${user.id}`, localStorage.getItem('nexus-favorites') || '[]');
  }

  function activateShoppingState(user) {
    const previousUserId = localStorage.getItem('nexus-active-user');
    if (previousUserId && previousUserId !== user.id) persistShoppingState(currentUser);
    if (previousUserId !== user.id) {
      localStorage.setItem('nexus-cart', localStorage.getItem(`nexus-cart:${user.id}`) || '[]');
      localStorage.setItem('nexus-favorites', localStorage.getItem(`nexus-favorites:${user.id}`) || '[]');
    }
    localStorage.setItem('nexus-active-user', user.id);
  }

  function clearActiveShoppingState() {
    persistShoppingState();
    localStorage.setItem('nexus-cart', '[]');
    localStorage.setItem('nexus-favorites', '[]');
    localStorage.removeItem('nexus-active-user');
  }

  function redirectForAuth(intent, target) {
    sessionStorage.setItem('nexus-pending-action', JSON.stringify({ intent, target }));
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `conta.html?redirect=${encodeURIComponent(returnTo)}&intent=${encodeURIComponent(intent)}`;
  }

  function replayPendingAction() {
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem('nexus-pending-action') || 'null'); } catch { pending = null; }
    if (!pending) return;
    sessionStorage.removeItem('nexus-pending-action');
    const target = pending.target || {};
    let element = null;
    if (pending.intent === 'buy-now') element = document.getElementById('detailBuyNow');
    if (pending.intent === 'checkout') element = document.getElementById('cartToggle');
    if (pending.intent === 'add-cart') {
      element = document.getElementById('detailAddCart');
      if (!element && target.productName) {
        element = [...document.querySelectorAll('.add-cart-btn')].find((button) => button.dataset.product === target.productName);
      }
    }
    if (pending.intent === 'favorite') {
      element = document.getElementById('detailFavorite');
      if (!element && target.productName) {
        element = [...document.querySelectorAll('.favorite-btn')].find((button) =>
          button.dataset.favorite === target.productName || button.dataset.favoriteProduct === target.productName);
      }
    }
    if (element) window.setTimeout(() => element.click(), 100);
  }

  function updateAccountLinks() {
    document.querySelectorAll('.store-account-link').forEach((link) => {
      link.setAttribute('aria-label', currentUser ? 'Minha conta' : 'Entrar ou criar conta');
      link.href = `conta.html?redirect=${encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`)}`;
    });
  }

  async function loadDeliveryOptions() {
    if (!client) return [];
    const { data, error } = await client.from('delivery_options')
      .select('id,name,fee,estimate,requires_address').eq('active', true).order('display_order');
    if (error) throw error;
    window.NEXUS_DELIVERY_OPTIONS = data || [];
    return window.NEXUS_DELIVERY_OPTIONS;
  }

  async function createOrder({ items, deliveryOptionId, paymentMethod, customerName, phone, street, number, complement, cep }) {
    if (!client || !currentUser) throw new Error('Entre na sua conta antes de confirmar o pedido.');
    const { data, error } = await client.rpc('create_store_order', {
      p_items: items.map((item) => ({ name: item.name, size: item.size || 'M', quantity: Number(item.quantity || 1) })),
      p_delivery_option_id: deliveryOptionId,
      p_payment_method: paymentMethod,
      p_customer_name: customerName,
      p_customer_phone: phone || null,
      p_street: street || null,
      p_number: number || null,
      p_complement: complement || null,
      p_cep: cep || null
    });
    if (error) throw error;
    return data;
  }

  window.NexusStoreAccount = { client, ready, getUser: () => currentUser, loadDeliveryOptions, createOrder };

  if (!accountPage) {
    document.addEventListener('click', async (event) => {
      const target = event.target.closest('#detailFavorite, .favorite-btn, #detailAddCart, .add-cart-btn, #detailBuyNow');
      const checkout = event.target.closest('.cart-checkout, [data-confirm-order]');
      if (!target && !checkout) return;
      if (!currentUser) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await ready;
        if (currentUser) {
          (target || checkout).click();
          return;
        }
        const intent = checkout ? 'checkout' : target?.id === 'detailBuyNow' ? 'buy-now'
          : target?.id === 'detailFavorite' || target?.matches('.favorite-btn') ? 'favorite' : 'add-cart';
        const productName = target?.dataset.product || target?.dataset.favoriteProduct || target?.dataset.favorite
          || window.NEXUS_PRODUCTS?.[new URLSearchParams(window.location.search).get('id')]?.name || '';
        redirectForAuth(intent, { productName });
        return;
      }
      if (target || event.target.closest('.qty-btn, .remove-cart-item, [data-cart-action]')) {
        window.setTimeout(() => persistShoppingState(), 0);
      }
      if (!checkout) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const localCart = (() => {
        try { return JSON.parse(localStorage.getItem('nexus-cart') || '[]'); } catch { return []; }
      })();
      const isDrawer = Boolean(checkout?.matches('[data-confirm-order]'));
      const field = (name, fallbackId) => isDrawer
        ? document.getElementById(`shop${name}`)?.value?.trim() || ''
        : document.getElementById(fallbackId)?.value?.trim() || '';
      const selectedDelivery = isDrawer ? document.getElementById('shopDeliveryOption') : document.getElementById('deliveryOption');
      const paymentMethod = isDrawer ? document.getElementById('shopPaymentMethod')?.value
        : document.querySelector('.payment-option.active')?.dataset.method;
      const options = window.NEXUS_DELIVERY_OPTIONS || [];
      const delivery = options.find((option) => option.id === selectedDelivery?.value);
      if (!localCart.length || !delivery || !paymentMethod) {
        window.alert('O carrinho está vazio ou as opções de entrega ainda não carregaram.');
        return;
      }
      const orderData = {
        items: localCart,
        deliveryOptionId: delivery.id,
        paymentMethod,
        customerName: field('Name', 'customerName'),
        phone: field('Phone', 'customerPhone'),
        street: field('Street', 'customerStreet'),
        number: field('Number', 'customerNumber'),
        complement: field('Complement', 'customerComplement'),
        cep: field('CEP', 'customerCEP')
      };
      const status = document.getElementById(isDrawer ? 'shopOrderStatus' : 'checkoutStatus');
      if (delivery.requires_address && (!orderData.street || !orderData.number || !orderData.cep)) {
        message(status, 'Preencha rua, número e CEP para esta modalidade.');
        return;
      }
      if (!orderData.customerName) {
        message(status, 'Informe o nome que deve constar no pedido.');
        return;
      }
      const submitButton = checkout;
      submitButton.disabled = true;
      try {
        await createOrder(orderData);
        localStorage.setItem('nexus-cart', '[]');
        localStorage.setItem(`nexus-cart:${currentUser.id}`, '[]');
        sessionStorage.setItem('nexus-order-notice', 'Pedido registrado e aguardando confirmação do pagamento.');
        window.location.reload();
      } catch (error) {
        message(status, error.message || 'Não foi possível registrar o pedido.');
        submitButton.disabled = false;
      }
    }, true);
  }

  async function loadProfile(user) {
    const { data, error } = await client.from('customer_profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    const form = document.getElementById('profilePanel');
    if (!form) return;
    form.elements.email.value = user.email || '';
    form.elements.full_name.value = data?.full_name || user.user_metadata?.full_name || '';
    form.elements.phone.value = data?.phone || '';
    form.elements.birth_date.value = data?.birth_date || '';
    form.elements.gender_identity.value = data?.gender_identity || '';
    form.elements.sexual_orientation.value = data?.sexual_orientation || '';
    document.getElementById('accountWelcome').textContent = `Olá, ${(data?.full_name || user.email || '').split(' ')[0]}`;
  }

  async function loadOrders(user) {
    const container = document.getElementById('ordersList');
    if (!container) return;
    container.innerHTML = '<p class="account-empty">Carregando seus pedidos...</p>';
    const { data, error } = await client.from('store_orders')
      .select('id,status,total,created_at,delivery_name,delivery_options(name,estimate),store_order_items(product_name,size,quantity,unit_price)')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      container.innerHTML = `<p class="account-empty">${escapeHtml(error.message)}</p>`;
      return;
    }
    if (!data?.length) {
      container.innerHTML = '<p class="account-empty">Você ainda não tem pedidos.</p>';
      return;
    }
    container.innerHTML = data.map((order) => {
      const date = new Date(order.created_at).toLocaleDateString('pt-BR');
      const items = (order.store_order_items || []).map((item) =>
        `${item.quantity}x ${escapeHtml(item.product_name)} (${escapeHtml(item.size)})`).join(', ');
      const delivery = order.delivery_options?.name || order.delivery_name;
      return `<article class="order-card"><div class="order-card-heading"><strong>Pedido #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</strong><span>${date}</span></div><p>${items}</p><p>${escapeHtml(delivery)} · ${escapeHtml(order.status.replaceAll('_', ' '))}</p><p>Total ${formatMoney(order.total)}</p></article>`;
    }).join('');
  }

  function setAccountTab(tab) {
    const profile = tab === 'profile';
    document.getElementById('profileTab').classList.toggle('is-active', profile);
    document.getElementById('ordersTab').classList.toggle('is-active', !profile);
    document.getElementById('profileTab').setAttribute('aria-selected', String(profile));
    document.getElementById('ordersTab').setAttribute('aria-selected', String(!profile));
    document.getElementById('profilePanel').hidden = !profile;
    document.getElementById('ordersPanel').hidden = profile;
    if (!profile && currentUser) loadOrders(currentUser);
  }

  function setupAccountPage() {
    const authView = document.getElementById('accountAuthView');
    const signedView = document.getElementById('accountSignedView');
    const authMessage = document.getElementById('accountMessage');
    const profileMessage = document.getElementById('profileMessage');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginPanel = document.getElementById('loginPanel');
    const signupPanel = document.getElementById('signupPanel');
    const signupPassword = signupPanel.elements.password;
    const signupPasswordConfirmation = signupPanel.elements.password_confirmation;
    const validatePasswordConfirmation = () => {
      signupPasswordConfirmation.setCustomValidity(
        signupPasswordConfirmation.value && signupPasswordConfirmation.value !== signupPassword.value
          ? 'As senhas não são iguais.' : ''
      );
    };
    signupPassword.addEventListener('input', validatePasswordConfirmation);
    signupPasswordConfirmation.addEventListener('input', validatePasswordConfirmation);

    const switchMode = (signup) => {
      loginTab.classList.toggle('is-active', !signup);
      signupTab.classList.toggle('is-active', signup);
      loginTab.setAttribute('aria-selected', String(!signup));
      signupTab.setAttribute('aria-selected', String(signup));
      loginPanel.hidden = signup;
      signupPanel.hidden = !signup;
      message(authMessage, client ? '' : configMissingMessage);
    };
    loginTab.addEventListener('click', () => switchMode(false));
    signupTab.addEventListener('click', () => switchMode(true));
    document.getElementById('profileTab').addEventListener('click', () => setAccountTab('profile'));
    document.getElementById('ordersTab').addEventListener('click', () => setAccountTab('orders'));

    if (!client) {
      message(authMessage, configMissingMessage);
      authView.querySelectorAll('button[type="submit"]').forEach((button) => { button.disabled = true; });
      loginPanel.addEventListener('submit', (event) => event.preventDefault());
      signupPanel.addEventListener('submit', (event) => event.preventDefault());
      return;
    }

    loginPanel.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(loginPanel);
      const email = String(values.get('email')).trim();
      if (!emailPattern.test(email)) return message(authMessage, 'Digite um e-mail no formato nome@dominio.com.');
      const { data, error } = await client.auth.signInWithPassword({ email, password: values.get('password') });
      if (error) return message(authMessage, error.message);
      currentUser = data.user;
      await showSignedIn(data.user);
    });
    signupPanel.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(signupPanel);
      const email = String(values.get('email')).trim();
      const password = String(values.get('password'));
      if (!emailPattern.test(email)) return message(authMessage, 'Digite um e-mail no formato nome@dominio.com.');
      if (password.length < 6) return message(authMessage, 'A senha precisa ter pelo menos 6 caracteres.');
      if (password !== values.get('password_confirmation')) return message(authMessage, 'As senhas não são iguais.');
      const { data, error } = await client.auth.signUp({
        email, password,
        options: { data: { full_name: values.get('full_name') } }
      });
      if (error) return message(authMessage, error.message);
      if (!data.session) return message(authMessage, 'Cadastro iniciado. Confirme seu e-mail e depois entre na conta.', false);
      currentUser = data.user;
      await showSignedIn(data.user);
    });
    document.getElementById('accountSignout').addEventListener('click', async () => {
      clearActiveShoppingState();
      currentUser = null;
      await client.auth.signOut();
      signedView.hidden = true;
      authView.hidden = false;
      message(authMessage, 'Você saiu da sua conta.', false);
    });
    document.getElementById('profilePanel').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!currentUser) return;
      const values = new FormData(event.currentTarget);
      const profile = {
        id: currentUser.id,
        full_name: values.get('full_name').trim(),
        phone: values.get('phone').trim() || null,
        birth_date: values.get('birth_date') || null,
        gender_identity: values.get('gender_identity') || null,
        sexual_orientation: values.get('sexual_orientation') || null,
        updated_at: new Date().toISOString()
      };
      const { error } = await client.from('customer_profiles').upsert(profile);
      if (error) return message(profileMessage, error.message);
      await loadProfile(currentUser);
      message(profileMessage, 'Seus dados foram atualizados.', false);
    });
  }

  async function showSignedIn(user) {
    currentUser = user;
    activateShoppingState(user);
    const authView = document.getElementById('accountAuthView');
    const signedView = document.getElementById('accountSignedView');
    if (authView && signedView) {
      authView.hidden = true;
      signedView.hidden = false;
      try { await loadProfile(user); } catch (error) { message(document.getElementById('profileMessage'), error.message); }
    }
    updateAccountLinks();
    if (accountPage) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const pending = sessionStorage.getItem('nexus-pending-action');
      if (redirect && pending) {
        const destination = new URL(redirect, window.location.href);
        if (destination.origin === window.location.origin) window.location.href = destination.href;
      }
    }
  }

  async function initialize() {
    if (accountPage) setupAccountPage();
    const notice = sessionStorage.getItem('nexus-order-notice');
    if (notice) {
      sessionStorage.removeItem('nexus-order-notice');
      message(document.getElementById('checkoutStatus'), notice, false);
    }
    if (!client) {
      window.NEXUS_DELIVERY_OPTIONS = [];
      document.querySelectorAll('#deliveryOption').forEach((select) => {
        select.innerHTML = '<option value="">Conexão com o banco não configurada</option>';
        select.disabled = true;
      });
      document.querySelectorAll('#deliveryStatus').forEach((element) => {
        element.textContent = 'Configure o Supabase para carregar as modalidades de entrega.';
      });
      updateAccountLinks();
      readyResolve();
      return;
    }
    const { data } = await client.auth.getSession();
    if (data.session?.user) await showSignedIn(data.session.user);
    else updateAccountLinks();
    client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      if (currentUser?.id !== nextUser?.id) {
        if (currentUser) persistShoppingState(currentUser);
        if (nextUser) activateShoppingState(nextUser);
        else clearActiveShoppingState();
      }
      currentUser = nextUser;
      updateAccountLinks();
    });
    try {
      const options = await loadDeliveryOptions();
      document.querySelectorAll('#deliveryOption').forEach((select) => {
        const previous = select.value;
        select.innerHTML = options.map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.name)} · ${formatMoney(option.fee)} · ${escapeHtml(option.estimate)}</option>`).join('');
        if (options.some((option) => option.id === previous)) select.value = previous;
        select.addEventListener('change', () => {
          const selected = options.find((option) => option.id === select.value);
          const addressFields = document.getElementById('customerAddressFields');
          if (addressFields) addressFields.hidden = !selected?.requires_address;
        });
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } catch (error) {
      document.querySelectorAll('#deliveryStatus').forEach((element) => { element.textContent = `Não foi possível carregar as entregas: ${error.message}`; });
    }
    readyResolve();
    if (currentUser) replayPendingAction();
  }

  initialize().catch((error) => {
    const status = document.getElementById('accountMessage');
    message(status, error.message || 'Não foi possível conectar à conta.');
    readyResolve();
  });
})();
import './style.css';

const root = document.querySelector('#app');
const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const date = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' });
const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7H10v7H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  products: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 8v5"/>',
  employees: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0M19 8h3m-1.5-1.5v3"/>',
  cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h2l2.7 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 8H5"/>',
  sales: '<path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M16 6h4v4"/>',
  plus: '<path d="M12 5v14m-7-7h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  receipt: '<path d="M4 3h16v18l-4-2-4 2-4-2-4 2V3Z"/><path d="M8 8h8m-8 4h8m-8 4h4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};
const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

const state = { user: null, view: 'home', modal: null, cart: [], clients: [], products: [], notice: null };
const sections = {
  clients: { title: 'Clientes', singular: 'cliente', icon: 'clients', columns: [['id', 'Código'], ['dni', 'DNI'], ['name', 'Nombres'], ['address', 'Dirección'], ['status', 'Estado']], fields: [['dni', 'DNI', 'text', true], ['name', 'Nombres', 'text', true], ['address', 'Dirección', 'text'], ['status', 'Estado', 'select']] },
  employees: { title: 'Empleados', singular: 'empleado', icon: 'employees', columns: [['id', 'Código'], ['dni', 'DNI'], ['name', 'Nombres'], ['phone', 'Teléfono'], ['username', 'Usuario'], ['status', 'Estado']], fields: [['dni', 'DNI', 'text', true], ['name', 'Nombres', 'text', true], ['phone', 'Teléfono', 'text'], ['username', 'Usuario', 'text', true], ['status', 'Estado', 'select']] },
  products: { title: 'Productos', singular: 'producto', icon: 'products', columns: [['id', 'Código'], ['name', 'Descripción'], ['price', 'Precio'], ['stock', 'Stock'], ['status', 'Estado']], fields: [['name', 'Descripción', 'text', true], ['price', 'Precio (S/)', 'number', true], ['stock', 'Stock', 'number', true], ['status', 'Estado', 'select']] },
};

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'No se pudo completar la operación.');
  return body;
}

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const displayDate = (value) => value ? date.format(new Date(`${String(value).slice(0, 10)}T12:00:00`)) : '—';
const showNotice = (message, type = 'success') => {
  state.notice = { message, type };
  const holder = document.querySelector('.toast-slot');
  if (holder) holder.innerHTML = `<div class="toast toast-${type}" role="status">${escapeHTML(message)}</div>`;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => { state.notice = null; if (holder) holder.innerHTML = ''; }, 3600);
};
const emptyState = (message) => `<div class="empty-state"><span class="empty-mark">${icon('search', 23)}</span><strong>Sin resultados</strong><p>${escapeHTML(message)}</p></div>`;

function renderLogin(message = '') {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-rail" aria-hidden="true"><span>SV</span><i></i><i></i><i></i></div>
      <section class="login-panel">
        <div class="brand-lockup"><span class="brand-symbol">${icon('receipt', 24)}</span><span>VENTAS<span class="brand-period">.</span></span></div>
        <p class="eyebrow">GESTIÓN COMERCIAL</p>
        <h1>Bienvenido<br />de vuelta.</h1>
        <p class="login-intro">Ingresa tus datos para acceder al sistema.</p>
        <form id="login-form" class="login-form">
          <label for="login-user">Usuario</label>
          <input id="login-user" name="user" autocomplete="username" placeholder="Ej. emp01" required />
          <label for="login-password">Contraseña</label>
          <div class="password-field"><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Ingresa tu contraseña" required /><button class="password-toggle" type="button" aria-label="Mostrar contraseña">${icon('eye', 17)}</button></div>
          ${message ? `<p class="form-error" role="alert">${escapeHTML(message)}</p>` : ''}
          <button class="button button-primary login-submit" type="submit">Ingresar al sistema <span>→</span></button>
        </form>
        <p class="login-foot">Sistema de Ventas Web <span>·</span> Mi Base</p>
      </section>
    </main>`;
  root.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      state.user = await api('/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      state.view = 'home';
      render();
    } catch (error) {
      renderLogin(error.message);
    }
  });
  root.querySelector('.password-toggle').addEventListener('click', (event) => {
    const input = root.querySelector('#login-password');
    input.type = input.type === 'password' ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-label', input.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
    event.currentTarget.innerHTML = icon('eye', 17);
  });
}

function renderShell() {
  const navItems = [['home', 'Inicio'], ['products', 'Productos'], ['employees', 'Empleados'], ['clients', 'Clientes'], ['new-sale', 'Nueva venta'], ['sales', 'Ventas']];
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="#home" data-view="home"><span class="brand-symbol">${icon('receipt', 19)}</span><span>Sistema de Ventas</span></a>
        <nav class="main-nav" aria-label="Navegación principal">${navItems.map(([view, label]) => `<button type="button" class="nav-link ${state.view === view ? 'active' : ''}" data-view="${view}">${icon(view === 'new-sale' ? 'cart' : view === 'sales' ? 'sales' : view, 16)}<span>${label}</span></button>`).join('')}</nav>
        <div class="user-menu"><span class="user-avatar">${escapeHTML((state.user?.name || 'U').split(' ').map((part) => part[0]).slice(0, 2).join(''))}</span><div class="user-copy"><strong>${escapeHTML(state.user?.name || 'Usuario')}</strong><small>${escapeHTML(state.user?.username || '')}</small></div><button class="icon-button logout-button" type="button" data-action="logout" aria-label="Salir" title="Cerrar sesión">${icon('logout')}</button></div>
      </header>
      <main class="page-content"><div class="toast-slot" aria-live="polite"></div><section id="view-content" class="view-content"></section></main>
      <footer class="app-footer"><span>Sistema de Ventas Web</span><span>Conectado a <strong>mi_base</strong></span></footer>
      <div id="modal-slot"></div>
    </div>`;
  root.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
  root.querySelector('[data-action="logout"]').addEventListener('click', async () => {
    try { await api('/logout', { method: 'POST' }); } finally { state.user = null; state.cart = []; renderLogin(); }
  });
}

function navigate(view) {
  state.view = view;
  state.modal = null;
  renderShell();
  renderView().catch((error) => showNotice(error.message, 'error'));
}

async function render() {
  if (!state.user) {
    try { state.user = (await api('/session')).user; } catch { state.user = null; }
  }
  if (!state.user) return renderLogin();
  renderShell();
  try { await renderView(); } catch (error) { showNotice(error.message, 'error'); }
}

async function renderView() {
  const content = document.querySelector('#view-content');
  if (state.view === 'home') return renderDashboard(content);
  if (sections[state.view]) return renderEntity(content, state.view);
  if (state.view === 'new-sale') return renderNewSale(content);
  if (state.view === 'sales') return renderSales(content);
  state.view = 'home';
  return renderDashboard(content);
}

async function renderDashboard(content) {
  const data = await api('/dashboard');
  const metrics = [
    ['clients', 'Clientes registrados', data.clients, 'Personas en tu cartera', 'aqua'],
    ['products', 'Productos activos', data.products, 'Referencias en catálogo', 'green'],
    ['sales', 'Ventas realizadas', data.sales, 'Operaciones registradas', 'orange'],
    ['receipt', 'Ingresos acumulados', money.format(data.amount), 'Total vendido', 'blue'],
  ];
  content.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">PANEL DE CONTROL</p><h1>Resumen general</h1><p class="page-subtitle">Una vista rápida de la actividad de tu negocio.</p></div><button class="button button-primary" type="button" data-view="new-sale">${icon('plus', 17)} Nueva venta</button></div>
    <div class="metric-grid">${metrics.map(([symbol, label, value, note, tone]) => `<article class="metric-card"><div class="metric-top"><span class="metric-icon ${tone}">${icon(symbol, 19)}</span><span class="metric-note">${note}</span></div><strong class="metric-value">${escapeHTML(value)}</strong><span class="metric-label">${label}</span></article>`).join('')}</div>
    <section class="content-section"><div class="section-heading"><div><p class="eyebrow">MOVIMIENTO RECIENTE</p><h2>Últimas ventas</h2></div><button class="text-button" type="button" data-view="sales">Ver todas <span>→</span></button></div>
      ${data.recent.length ? `<div class="table-wrap"><table><thead><tr><th>Serie</th><th>Cliente</th><th>Fecha</th><th class="numeric">Importe</th><th>Estado</th></tr></thead><tbody>${data.recent.map((sale) => `<tr><td><span class="serial-cell">#${escapeHTML(sale.serial || sale.id)}</span></td><td>${escapeHTML(sale.client || 'Cliente eliminado')}</td><td>${displayDate(sale.date)}</td><td class="numeric">${money.format(sale.amount)}</td><td><span class="status-pill">Completada</span></td></tr>`).join('')}</tbody></table></div>` : emptyState('Cuando registres una venta, aparecerá aquí.')}
    </section>
    <div class="quick-links"><button type="button" data-view="clients"><span class="quick-icon aqua">${icon('clients')}</span><span><strong>Administrar clientes</strong><small>Consulta y actualiza tus contactos</small></span><b>→</b></button><button type="button" data-view="products"><span class="quick-icon green">${icon('products')}</span><span><strong>Revisar productos</strong><small>Precios y niveles de inventario</small></span><b>→</b></button><button type="button" data-view="employees"><span class="quick-icon orange">${icon('employees')}</span><span><strong>Equipo de trabajo</strong><small>Usuarios y datos del personal</small></span><b>→</b></button></div>`;
  bindViewButtons(content);
}

function bindViewButtons(container) {
  container.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
}

const resourcePath = (key) => ({ clients: 'clients', employees: 'employees', products: 'products' })[key];
const cellValue = (key, field, value) => {
  if (field === 'status') return `<span class="${value === '1' ? 'status-pill' : 'status-pill status-off'}">${value === '1' ? 'Activo' : 'Inactivo'}</span>`;
  if (field === 'price') return money.format(value);
  if (field === 'stock') return `<span class="stock-value ${Number(value) < 10 ? 'low-stock' : ''}">${escapeHTML(value)}</span>`;
  if (field === 'id') return `<span class="id-cell">${String(value).padStart(3, '0')}</span>`;
  return escapeHTML(value || '—');
};

async function renderEntity(content, key, search = '') {
  const config = sections[key];
  const records = await api(`/${resourcePath(key)}?search=${encodeURIComponent(search)}`);
  content.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">MANTENIMIENTO</p><h1>${config.title}</h1><p class="page-subtitle">Administra los datos de ${config.title.toLowerCase()} del sistema.</p></div><button class="button button-primary" type="button" data-action="add">${icon('plus', 17)} Nuevo ${config.singular}</button></div>
    <section class="content-section entity-section"><div class="list-toolbar"><div class="record-count"><strong>${records.length}</strong> ${records.length === 1 ? config.singular : `${config.title.toLowerCase()}`}</div><label class="search-box">${icon('search', 17)}<input type="search" id="table-search" placeholder="Buscar ${config.title.toLowerCase()}..." value="${escapeHTML(search)}" /></label></div>
    ${records.length ? `<div class="table-wrap"><table><thead><tr>${config.columns.map(([, label]) => `<th>${label}</th>`).join('')}<th class="actions-heading">Acciones</th></tr></thead><tbody>${records.map((record) => `<tr>${config.columns.map(([field]) => `<td>${cellValue(key, field, record[field])}</td>`).join('')}<td class="row-actions"><button type="button" class="table-action" data-action="edit" data-id="${record.id}" aria-label="Editar" title="Editar">✎</button><button type="button" class="table-action danger" data-action="delete" data-id="${record.id}" aria-label="Eliminar" title="Eliminar">×</button></td></tr>`).join('')}</tbody></table></div>` : emptyState(search ? 'Prueba con otro término de búsqueda.' : `Aún no hay ${config.title.toLowerCase()} registrados.`)}
    <div class="table-foot"><span>Base de datos: mi_base</span><span>${records.length} registro${records.length === 1 ? '' : 's'}</span></div></section>`;

  let searchTimer;
  content.querySelector('#table-search').addEventListener('input', (event) => {
    window.clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = window.setTimeout(async () => {
      const position = event.target.selectionStart;
      await renderEntity(content, key, value);
      const input = content.querySelector('#table-search');
      input.focus();
      input.setSelectionRange(position, position);
    }, 220);
  });
  content.querySelector('[data-action="add"]').addEventListener('click', () => openEntityModal(key));
  content.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener('click', () => openEntityModal(key, records.find((record) => record.id === Number(button.dataset.id)))));
  content.querySelectorAll('[data-action="delete"]').forEach((button) => button.addEventListener('click', async () => {
    const record = records.find((item) => item.id === Number(button.dataset.id));
    if (!window.confirm(`¿Eliminar ${config.singular} "${record?.name || record?.dni}"?`)) return;
    try {
      await api(`/${resourcePath(key)}/${button.dataset.id}`, { method: 'DELETE' });
      showNotice(`${config.title.slice(0, -1)} eliminado.`);
      await renderEntity(content, key, content.querySelector('#table-search').value);
    } catch (error) { showNotice(error.message, 'error'); }
  }));
}

function openEntityModal(key, record = null) {
  const config = sections[key];
  const slot = document.querySelector('#modal-slot');
  slot.innerHTML = `<div class="modal-backdrop"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><p class="eyebrow">${record ? 'ACTUALIZAR DATOS' : 'NUEVO REGISTRO'}</p><h2 id="modal-title">${record ? 'Editar' : 'Agregar'} ${config.singular}</h2></div><button class="icon-button" type="button" data-close aria-label="Cerrar">${icon('close')}</button></div><form id="entity-form" class="form-grid">${config.fields.map(([field, label, type, required]) => `<label class="field ${field === 'name' || field === 'address' ? 'field-wide' : ''}"><span>${label}${required ? '<i>*</i>' : ''}</span>${type === 'select' ? `<select name="${field}"><option value="1" ${!record || record[field] === '1' ? 'selected' : ''}>Activo</option><option value="0" ${record?.[field] === '0' ? 'selected' : ''}>Inactivo</option></select>` : `<input name="${field}" type="${type}" ${type === 'number' ? 'min="0" step="any"' : ''} value="${escapeHTML(record?.[field] ?? '')}" ${required ? 'required' : ''} ${field === 'dni' ? 'maxlength="8"' : ''} />`}</label>`).join('')}<p class="form-hint field-wide">* Campos obligatorios</p><div class="modal-actions field-wide"><button class="button button-quiet" type="button" data-close>Cancelar</button><button class="button button-primary" type="submit">${record ? 'Guardar cambios' : 'Guardar registro'}</button></div></form></section></div>`;
  slot.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => { slot.innerHTML = ''; }));
  slot.querySelector('.modal-backdrop').addEventListener('click', (event) => { if (event.target.classList.contains('modal-backdrop')) slot.innerHTML = ''; });
  slot.querySelector('#entity-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await api(`/${resourcePath(key)}${record ? `/${record.id}` : ''}`, { method: record ? 'PUT' : 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      slot.innerHTML = '';
      showNotice(`${config.title.slice(0, -1)} ${record ? 'actualizado' : 'agregado'} correctamente.`);
      await renderEntity(document.querySelector('#view-content'), key);
    } catch (error) {
      showNotice(error.message, 'error');
      button.disabled = false;
    }
  });
  slot.querySelector('input')?.focus();
}

async function renderNewSale(content) {
  const [clients, products, number] = await Promise.all([api('/clients'), api('/products'), api('/sales/next-number')]);
  state.clients = clients.filter((client) => client.status === '1');
  state.products = products.filter((product) => product.status === '1');
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  content.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">PUNTO DE VENTA</p><h1>Nueva venta</h1><p class="page-subtitle">Selecciona un cliente y agrega productos al comprobante.</p></div><span class="serial-label">N.º DE SERIE <strong>${escapeHTML(number.serial)}</strong></span></div>
    <div class="sale-layout"><section class="content-section sale-form-section"><div class="section-heading compact"><div><p class="eyebrow">PASO 01</p><h2>Datos de la venta</h2></div></div><label class="field"><span>Cliente <i>*</i></span><select id="sale-client" required><option value="">Selecciona un cliente</option>${state.clients.map((client) => `<option value="${client.id}">${escapeHTML(client.name)} · DNI ${escapeHTML(client.dni)}</option>`).join('')}</select></label><div class="sale-divider"></div><div class="section-heading compact"><div><p class="eyebrow">PASO 02</p><h2>Agregar productos</h2></div></div><label class="field"><span>Producto</span><select id="sale-product"><option value="">Selecciona un producto</option>${state.products.map((product) => `<option value="${product.id}" ${product.stock < 1 ? 'disabled' : ''}>${escapeHTML(product.name)} · ${money.format(product.price)} · Stock ${product.stock}</option>`).join('')}</select></label><div class="product-pick"><label class="field"><span>Cantidad</span><input id="sale-quantity" type="number" value="1" min="1" step="1" /></label><button type="button" class="button button-secondary" id="add-to-cart">${icon('plus', 17)} Agregar</button></div><div class="sale-tip">El precio y el stock se validan con la base de datos al confirmar.</div></section>
      <section class="content-section cart-section"><div class="section-heading compact"><div><p class="eyebrow">COMPROBANTE</p><h2>Detalle de venta</h2></div><span class="cart-count">${state.cart.reduce((sum, line) => sum + line.quantity, 0)} ítems</span></div>${state.cart.length ? `<div class="cart-list">${state.cart.map((line) => `<div class="cart-row"><div class="cart-product"><span class="cart-product-icon">${icon('products', 18)}</span><span><strong>${escapeHTML(line.name)}</strong><small>${money.format(line.price)} · ${line.quantity} unidad${line.quantity === 1 ? '' : 'es'}</small></span></div><strong class="cart-subtotal">${money.format(line.price * line.quantity)}</strong><button type="button" class="table-action danger" data-remove="${line.productId}" aria-label="Quitar ${escapeHTML(line.name)}">×</button></div>`).join('')}</div>` : `<div class="cart-empty">${icon('cart', 25)}<p>Aún no hay productos</p><span>Agrega productos para iniciar la venta.</span></div>`}<div class="cart-total"><span>Total a pagar</span><strong>${money.format(total)}</strong></div><button type="button" class="button button-primary confirm-sale" id="confirm-sale" ${state.cart.length ? '' : 'disabled'}>Confirmar venta <span>→</span></button></section></div>`;

  content.querySelector('#add-to-cart').addEventListener('click', () => {
    const product = state.products.find((item) => item.id === Number(content.querySelector('#sale-product').value));
    const quantity = Number(content.querySelector('#sale-quantity').value);
    if (!product) return showNotice('Selecciona un producto.', 'error');
    if (!Number.isInteger(quantity) || quantity < 1) return showNotice('La cantidad debe ser un entero mayor que cero.', 'error');
    const existing = state.cart.find((item) => item.productId === product.id);
    if ((existing?.quantity || 0) + quantity > product.stock) return showNotice(`Solo hay ${product.stock} unidades disponibles.`, 'error');
    if (existing) existing.quantity += quantity;
    else state.cart.push({ productId: product.id, name: product.name, price: product.price, quantity });
    renderNewSale(content);
  });
  content.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
    state.cart = state.cart.filter((item) => item.productId !== Number(button.dataset.remove));
    renderNewSale(content);
  }));
  content.querySelector('#confirm-sale').addEventListener('click', async (event) => {
    const clientId = Number(content.querySelector('#sale-client').value);
    if (!clientId) return showNotice('Selecciona un cliente antes de confirmar.', 'error');
    event.currentTarget.disabled = true;
    try {
      const sale = await api('/sales', { method: 'POST', body: JSON.stringify({ clientId, lines: state.cart.map(({ productId, quantity }) => ({ productId, quantity })) }) });
      state.cart = [];
      showNotice(`Venta ${sale.serial} registrada por ${money.format(sale.amount)}.`);
      navigate('sales');
    } catch (error) {
      showNotice(error.message, 'error');
      event.currentTarget.disabled = false;
    }
  });
}

async function renderSales(content) {
  const sales = await api('/sales');
  content.innerHTML = `<div class="page-heading"><div><p class="eyebrow">HISTORIAL</p><h1>Ventas</h1><p class="page-subtitle">Consulta los comprobantes registrados y su detalle.</p></div><button class="button button-primary" type="button" data-view="new-sale">${icon('plus', 17)} Nueva venta</button></div><section class="content-section entity-section"><div class="list-toolbar"><div class="record-count"><strong>${sales.length}</strong> venta${sales.length === 1 ? '' : 's'} registradas</div><span class="database-note">${icon('receipt', 16)} mi_base · ventas</span></div>${sales.length ? `<div class="table-wrap"><table><thead><tr><th>N.º de serie</th><th>Cliente</th><th>Empleado</th><th>Fecha</th><th class="numeric">Total</th><th>Estado</th><th></th></tr></thead><tbody>${sales.map((sale) => `<tr><td><span class="serial-cell">#${escapeHTML(sale.serial || sale.id)}</span></td><td>${escapeHTML(sale.client || 'Cliente eliminado')}</td><td>${escapeHTML(sale.employee || '—')}</td><td>${displayDate(sale.date)}</td><td class="numeric">${money.format(sale.amount)}</td><td><span class="status-pill">${sale.status === '1' ? 'Completada' : 'Anulada'}</span></td><td><button class="table-action" data-detail="${sale.id}" title="Ver detalle" aria-label="Ver detalle">${icon('receipt', 16)}</button></td></tr>`).join('')}</tbody></table></div>` : emptyState('Registra una venta para verla en este historial.')}<div class="table-foot"><span>Los importes se muestran en soles peruanos.</span><span>${sales.length} registro${sales.length === 1 ? '' : 's'}</span></div></section>`;
  bindViewButtons(content);
  content.querySelectorAll('[data-detail]').forEach((button) => button.addEventListener('click', () => openSaleDetail(button.dataset.detail)));
}

async function openSaleDetail(id) {
  try {
    const details = await api(`/sales/${id}`);
    const modal = document.querySelector('#modal-slot');
    modal.innerHTML = `<div class="modal-backdrop"><section class="modal-panel detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div class="modal-heading"><div><p class="eyebrow">COMPROBANTE #${escapeHTML(id)}</p><h2 id="detail-title">Detalle de venta</h2></div><button class="icon-button" data-close aria-label="Cerrar">${icon('close')}</button></div>${details.length ? `<div class="table-wrap detail-table"><table><thead><tr><th>Producto</th><th>Cantidad</th><th class="numeric">Precio</th><th class="numeric">Subtotal</th></tr></thead><tbody>${details.map((line) => `<tr><td>${escapeHTML(line.product)}</td><td>${line.quantity}</td><td class="numeric">${money.format(line.price)}</td><td class="numeric">${money.format(line.subtotal)}</td></tr>`).join('')}</tbody></table></div><div class="detail-total"><span>Total</span><strong>${money.format(details.reduce((sum, line) => sum + line.subtotal, 0))}</strong></div>` : emptyState('No se encontraron detalles para esta venta.')}</section></div>`;
    modal.querySelector('[data-close]').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('.modal-backdrop').addEventListener('click', (event) => { if (event.target.classList.contains('modal-backdrop')) modal.innerHTML = ''; });
  } catch (error) { showNotice(error.message, 'error'); }
}

render();
// cart.js - Funciones del carrito de compras

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
}

// Funciones del carrito
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function normalizeStockLimit(quantity) {
    if (quantity === null || quantity === undefined || quantity === '') return null;
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed)) return null;
    if (parsed <= 0) return 0;
    return Math.floor(parsed);
}

function addToCart(id, name, price, image, maxQuantity) {
    const cart = getCart();
    const stockLimit = normalizeStockLimit(maxQuantity);

    if (stockLimit === 0) {
        showNotification('Este producto no tiene stock disponible');
        return;
    }

    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (stockLimit !== null) {
            existing.stock = stockLimit;
        }

        const limit = typeof existing.stock === 'number' ? existing.stock : null;
        if (limit !== null && existing.quantity >= limit) {
            const unitsLabel = limit === 1 ? 'unidad' : 'unidades';
            showNotification(`Solo hay ${limit} ${unitsLabel} disponibles de este producto`);
            return;
        }

        existing.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            price,
            image,
            quantity: 1,
            stock: stockLimit,
        });
    }

    saveCart(cart);
    showNotification('Producto agregado al carrito');
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = '#25d366';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
}

function openCart() {
    const modal = document.createElement('div');
    modal.id = 'cart-modal';
    modal.innerHTML = `
        <div class="cart-modal-overlay" onclick="closeCart()"></div>
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h2>Carrito de Compras</h2>
                <button onclick="closeCart()" class="close-btn">&times;</button>
            </div>
            <div class="cart-items" id="cart-items"></div>
            <div class="cart-actions">
                <button onclick="clearCart()" class="btn-clear">Vaciar Carrito</button>
                <button onclick="showForm()" class="btn-checkout">Proceder al Pago</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    renderCartItems();
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) document.body.removeChild(modal);
}

function renderCartItems() {
    const cart = getCart();
    const cartItemsEl = document.getElementById('cart-items');
    if (!cartItemsEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p>El carrito está vacío</p>';
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cartItemsEl.innerHTML = cart.map(item => {
        const limit = typeof item.stock === 'number' ? item.stock : null;
        const maxReached = limit !== null && item.quantity >= limit;
        const stockInfo = limit !== null
            ? `<p class="cart-item-stock">Stock disponible: ${limit}</p>`
            : '';

        return `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}</p>
                ${stockInfo}
            </div>
            <div class="cart-item-controls">
                <button onclick="changeQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity('${item.id}', 1)" ${maxReached ? 'disabled' : ''}>+</button>
                <button onclick="removeFromCart('${item.id}')" class="remove-btn">×</button>
            </div>
        </div>
    `;
    }).join('') + `
        <div class="cart-total">
            <h3>Total: ${formatPrice(total)}</h3>
        </div>
    `;
}

function changeQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
        const limit = typeof item.stock === 'number' ? item.stock : null;
        if (delta > 0 && limit !== null && item.quantity >= limit) {
            const unitsLabel = limit === 1 ? 'unidad' : 'unidades';
            showNotification(`Solo hay ${limit} ${unitsLabel} disponibles de este producto`);
            return;
        }

        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart(cart);
            renderCartItems();
        }
    }
}

function removeFromCart(id) {
    const cart = getCart().filter(item => item.id !== id);
    saveCart(cart);
    renderCartItems();
}

function clearCart() {
    saveCart([]);
    renderCartItems();
}

function showForm() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('El carrito está vacío');
        return;
    }
    // Crear nuevo modal para formulario
    const formModal = document.createElement('div');
    formModal.id = 'form-modal';
    formModal.innerHTML = `
        <div class="cart-modal-overlay" onclick="closeFormModal()"></div>
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h2>Información del Cliente</h2>
                <button onclick="closeFormModal()" class="close-btn">&times;</button>
            </div>
            <form id="client-form">
                <input type="text" id="client-name" placeholder="Nombre completo" required>
                <input type="tel" id="client-phone" placeholder="Teléfono" required>
                <input type="email" id="client-email" placeholder="Email (opcional)">
                <textarea id="client-address" placeholder="Dirección de entrega" required></textarea>
                <button type="submit" class="btn-send">Enviar por WhatsApp</button>
            </form>
        </div>
    `;
    document.body.appendChild(formModal);
    document.getElementById('client-form').addEventListener('submit', handleFormSubmit);
}

function closeFormModal() {
    const modal = document.getElementById('form-modal');
    if (modal) document.body.removeChild(modal);
}

function handleFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const email = document.getElementById('client-email').value;
    const address = document.getElementById('client-address').value;

    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const message = `Hola, quiero comprar los siguientes productos:\n\n${cart.map(item => `- ${item.name} x${item.quantity} = ${formatPrice(item.price * item.quantity)}`).join('\n')}\n\nTotal: ${formatPrice(total)}\n\nCliente: ${name}\nTeléfono: ${phone}\nEmail: ${email}\nDirección: ${address}`;

    const whatsappUrl = `https://wa.me/573188014404?text=${encodeURIComponent(message)}`; // Replace with actual number
    window.open(whatsappUrl, '_blank');
    clearCart();
    closeCart();
    closeFormModal();
}

// Inicializar contador del carrito al cargar
document.addEventListener('DOMContentLoaded', updateCartCount);
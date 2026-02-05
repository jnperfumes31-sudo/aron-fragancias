
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSearchTerm = '';

let productsGrid, searchInput, searchBtn,
    categoryFiltersContainer, loadingState,
    errorState, emptyState, productsCount, retryBtn;

function resolveDOM() {
    productsGrid             = document.getElementById('productsGrid');
    searchInput              = document.getElementById('searchInput');
    searchBtn                = document.getElementById('searchBtn');
    categoryFiltersContainer = document.querySelector('.category-filters');
    loadingState             = document.getElementById('loadingState');
    errorState               = document.getElementById('errorState');
    emptyState               = document.getElementById('emptyState');
    productsCount            = document.getElementById('productsCount');
    retryBtn                 = document.getElementById('retryBtn');
}

// ─── Inicialización ─────────────────────────────────────────────────────────
async function init() {
    resolveDOM();
    setupEventListeners();
    updateCartCount();
    await loadProducts();
}

// ─── Listeners ───────────────────────────────────────────────────────────────
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Delegación: un solo listener para todos los filtros
    categoryFiltersContainer.addEventListener('click', handleCategoryFilter);
    retryBtn.addEventListener('click', loadProducts);
}

// ─── Carga de datos ──────────────────────────────────────────────────────────
async function loadProducts() {
    try {
        setUIState('loading');

        const { data, error } = await supabaseClient
            .from('productos')
            .select(`
                *,
                producto_imagenes!inner(url, es_principal),
                categorias:categoria_id (nombre)
            `)
            .eq('tipo_venta', 'detal')
            .eq('disponible', true)
            .eq('producto_imagenes.es_principal', true)
            .order('nombre', { ascending: true });

        if (error) throw error;

        allProducts      = data || [];
        filteredProducts = [...allProducts];

        renderCategoryFilters(allProducts);
        applyFiltersAndSort();
        renderProducts();

        setUIState('ready');
    } catch (err) {
        console.error('Error al cargar productos:', err);
        setUIState('error');
    }
}


function setUIState(state) {
    loadingState.style.display = state === 'loading' ? 'flex' : 'none';
    errorState.style.display   = state === 'error'   ? 'flex' : 'none';
    emptyState.style.display   = state === 'empty'   ? 'flex' : 'none';
}

// ─── Lógica de descuento (función pura, reutilizable) ───────────────────────
function calcDiscount(product) {
    const precioOriginal = product.precio || 0;
    const tieneDescuento = product.tiene_descuento === true;
    const valor          = product.descuento_valor || 0;
    const tipo           = product.descuento_tipo || 'none';

    if (!tieneDescuento || valor <= 0 || precioOriginal <= 0) {
        return { precioOriginal, precioFinal: precioOriginal, porcentaje: 0 };
    }

    let precioFinal, porcentaje;

    switch (tipo) {
        case 'monto':
            precioFinal = precioOriginal - valor;
            porcentaje  = Math.round((valor / precioOriginal) * 100);
            break;
        case 'fixed':
            precioFinal = valor;
            porcentaje  = Math.round(((precioOriginal - valor) / precioOriginal) * 100);
            break;
        case 'porcentaje':
        default:
            porcentaje  = valor;
            precioFinal = precioOriginal * (1 - valor / 100);
            break;
    }

    // Precio final nunca puede ser negativo
    precioFinal = Math.max(0, precioFinal);

    // Si el descuento hace que el precio final sea 0 o negativo, no aplicar descuento
    if (precioFinal <= 0) {
        return { precioOriginal, precioFinal: precioOriginal, porcentaje: 0 };
    }

    return { precioOriginal, precioFinal, porcentaje };
}

// ─── Renderizado de filtros ──────────────────────────────────────────────────
function renderCategoryFilters(products) {
    const categories = [...new Set(
        products.map(p => getProductCategory(p)).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const allBtn = `<button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
                        <i class="fas fa-th"></i> Todos
                    </button>`;

    const catBtns = categories.map(cat => {
        const icon = getCategoryIcon(cat);
        return `<button class="filter-btn ${currentCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">
                    <i class="${icon}"></i> ${escapeHtml(cat)}
                </button>`;
    });

    categoryFiltersContainer.innerHTML = [allBtn, ...catBtns].join('');
}

// ─── Renderizado de productos ────────────────────────────────────────────────
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '';
        updateProductsCount(0);
        setUIState('empty');
        return;
    }

    setUIState('ready');
    updateProductsCount(filteredProducts.length);
    productsGrid.innerHTML = filteredProducts.map(createProductCard).join('');
}

// ─── Tarjeta de producto ─────────────────────────────────────────────────────
function createProductCard(product) {
    const imageUrl        = getMainImageUrl(product);
    const stock           = parseStockValue(product.cantidad);
    const hasFiniteStock  = stock !== null;
    const inStock         = product.disponible === true && (!hasFiniteStock || stock > 0);
    const esAgotado       = product.agotado === true || !inStock;
    const category        = getProductCategory(product);
    const categoryClass   = getCategoryClass(category);
    const nombre          = product.nombre || product.name || 'Producto';

    // Descuento calculado por la función pura
    const { precioOriginal, precioFinal, porcentaje } = calcDiscount(product);

    // Sanitizar valores que van a atributos HTML
    const safeId     = escapeHtml(String(product.id));
    const safeName   = escapeHtml(nombre);
    const safeImg    = escapeHtml(imageUrl);

    return `
        <div class="product-card ${categoryClass}" data-product-id="${safeId}">
            ${porcentaje > 0 ? `
                <div class="discount-band">
                    <div class="discount-text">${porcentaje}%</div>
                </div>` : ''}

            ${esAgotado ? `
                <div class="out-of-stock-band">
                    <div class="out-of-stock-text">AGOTADO</div>
                </div>` : ''}

            <div class="product-image-container">
                <img src="${safeImg}"
                     alt="${safeName}"
                     class="product-image"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%231a1817%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%234a5568%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESin Imagen%3C/text%3E%3C/svg%3E'"
                     loading="lazy">
            </div>

            <div class="product-info">
                <h3 class="product-name">${safeName}</h3>
                ${category ? `<p class="product-category ${categoryClass}">${escapeHtml(category)}</p>` : ''}

                <div class="product-footer">
                    <div class="product-price">
                        ${porcentaje > 0 ? `
                            <span class="original-price"><span class="price-currency">$</span><span class="price-value">${formatPrice(precioOriginal)}</span></span>
                            <span class="discounted-price"><span class="price-currency">$</span><span class="price-value">${formatPrice(precioFinal)}</span></span>
                        ` : `
                            <span class="current-price"><span class="price-currency">$</span><span class="price-value">${formatPrice(precioOriginal)}</span></span>
                        `}
                    </div>

                    <div class="product-buttons">
                        <button class="add-to-cart-btn ${esAgotado ? 'disabled' : ''}"
                                data-id="${safeId}"
                                data-name="${safeName}"
                                data-price="${precioFinal}"
                                data-image="${safeImg}"
                                data-stock="${hasFiniteStock ? stock : ''}"
                                ${esAgotado ? 'disabled' : ''}>
                            ${esAgotado ? 'AGOTADO' : '<i class="fas fa-cart-plus"></i>'}
                        </button>

                        <button class="view-detail-btn" data-id="${safeId}">
                            Ver detalle
                        </button>
                    </div>
                </div>

                ${hasFiniteStock && stock > 0 && stock <= 5 && !esAgotado ? `
                    <p class="low-stock-warning">¡Solo quedan ${stock} unidades!</p>
                ` : ''}
            </div>
        </div>
    `;
}

// ─── Handlers de búsqueda y filtro ──────────────────────────────────────────
function handleSearch() {
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    applyFiltersAndSort();
    renderProducts();
}

function handleCategoryFilter(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    currentCategory = btn.dataset.category;
    categoryFiltersContainer.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.category === currentCategory)
    );

    applyFiltersAndSort();
    renderProducts();
}

// Handler delegado para los botones dentro de las tarjetas.
function handleCardButtons(e) {
    const addBtn    = e.target.closest('.add-to-cart-btn');
    const detailBtn = e.target.closest('.view-detail-btn');

    if (addBtn && !addBtn.disabled) {
        const { id, name, price, image, stock } = addBtn.dataset;
        addToCart(id, name, Number(price), image, stock === '' ? null : Number(stock));
    }

    if (detailBtn) {
        goToProductDetail(detailBtn.dataset.id);
    }
}

// ─── Filtrado y ordenamiento ─────────────────────────────────────────────────
function applyFiltersAndSort() {
    filteredProducts = allProducts.filter(product => {
        const category = getProductCategory(product);
        const matchesCategory = currentCategory === 'all' || category === currentCategory;

        const matchesSearch = !currentSearchTerm ||
            (product.nombre || product.name || '').toLowerCase().includes(currentSearchTerm) ||
            (product.descripcion || product.description || '').toLowerCase().includes(currentSearchTerm) ||
            category.toLowerCase().includes(currentSearchTerm);

        return matchesCategory && matchesSearch;
    });

    filteredProducts.sort((a, b) => {
        const nameA = (a.nombre || a.name || '').toLowerCase();
        const nameB = (b.nombre || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

// ─── Navegación ──────────────────────────────────────────────────────────────
function goToProductDetail(productId) {
    if (!productId) return;
    window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

// Obtiene la URL de la imagen principal de un producto
function getMainImageUrl(product) {
    if (product.producto_imagenes && product.producto_imagenes.length > 0) {
        return getImageUrl(product.producto_imagenes[0].url);
    }
    return '';
}

function getProductCategory(product) {
    return (product.categorias && product.categorias.nombre) || product.categoria || product.category || '';
}

function getCategoryClass(category) {
    const value = (category || '').toLowerCase();
    if (value.includes('hombre')) return 'cat-male';
    if (value.includes('mujer')) return 'cat-female';
    if (value.includes('unisex')) return 'cat-unisex';
    if (value.includes('nicho')) return 'cat-niche';
    return 'cat-default';
}

// Retorna el icono de Font Awesome correspondiente a la categoría
function getCategoryIcon(category) {
    const value = (category || '').toLowerCase();
    if (value.includes('hombre')) return 'fas fa-mars';
    if (value.includes('mujer')) return 'fas fa-venus';
    if (value.includes('unisex')) return 'fas fa-venus-mars';
    if (value.includes('nicho')) return 'fas fa-crown';
    return 'fas fa-th';
}

function formatPrice(price) {
    const num = parseFloat(price);
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
        maximumFractionDigits: 2
    }).format(num);
}

function parseStockValue(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function updateProductsCount(count) {
    productsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

// Escapa caracteres que podrían romper atributos HTML o inyectar código
function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, ch => map[ch]);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ─── Entrada ─────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        // Listener delegado al grid: captura clics en cualquier tarjeta
        document.getElementById('productsGrid').addEventListener('click', handleCardButtons);
    });
} else {
    init();
    document.getElementById('productsGrid').addEventListener('click', handleCardButtons);
}
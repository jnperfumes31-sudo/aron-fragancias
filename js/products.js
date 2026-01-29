// Estado de la aplicación
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSearchTerm = '';

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFiltersContainer = document.querySelector('.category-filters');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const productsCount = document.getElementById('productsCount');
const retryBtn = document.getElementById('retryBtn');

// Inicializar la aplicación
async function init() {
    setupEventListeners();
    await loadProducts();
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchBtn.addEventListener('click', handleSearch);
    
    // Filtros de categoría (delegación)
    categoryFiltersContainer.addEventListener('click', handleCategoryFilter);
    
    // Reintentar
    retryBtn.addEventListener('click', loadProducts);
    
    // Enter en búsqueda
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Cargar productos desde Supabase
async function loadProducts() {
    try {
        showLoading();
        hideError();
        hideEmpty();
        
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
        
        if (error) {
            throw error;
        }
        
        allProducts = data || [];
        filteredProducts = [...allProducts];
        renderCategoryFilters(allProducts);
        
        applyFiltersAndSort();
        renderProducts();
        hideLoading();
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showError();
        hideLoading();
    }
}

// Renderizar filtros de categoría de forma dinámica según datos cargados
function renderCategoryFilters(products) {
    const categories = new Set();
    products.forEach(p => {
        const cat = getProductCategory(p);
        if (cat) categories.add(cat);
    });

    const buttons = [
        `<button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">Todos</button>`
    ];

    Array.from(categories).sort((a, b) => a.localeCompare(b)).forEach(cat => {
        const isActive = currentCategory === cat;
        buttons.push(`<button class="filter-btn ${isActive ? 'active' : ''}" data-category="${cat}">${cat}</button>`);
    });

    categoryFiltersContainer.innerHTML = buttons.join('');
}

// Renderizar productos en la cuadrícula
function renderProducts() {
    if (filteredProducts.length === 0) {
        showEmpty();
        productsGrid.innerHTML = '';
        updateProductsCount(0);
        return;
    }
    
    hideEmpty();
    updateProductsCount(filteredProducts.length);
    
    productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// Crear tarjeta de producto
function createProductCard(product) {
    const imageUrl = product.producto_imagenes && product.producto_imagenes.length > 0 
        ? getImageUrl(product.producto_imagenes[0].url)
        : '';
    const inStock = product.disponible === true && (product.cantidad || 0) > 0;
    const productCategory = getProductCategory(product);
    const categoryClass = getCategoryClass(productCategory);
    
    // Datos de descuento
    const tieneDescuento = product.tiene_descuento === true;
    const esAgotado = product.agotado === true;
    const descuentoValor = product.descuento_valor || 0;
    const descuentoTipo = product.descuento_tipo || 'none';
    
    // Calcular precio con descuento
    let precioOriginal = product.precio || 0;
    let precioFinal = precioOriginal;
    let porcentajeDescuento = 0;
    
    if (tieneDescuento && descuentoValor > 0) {
        if (descuentoTipo === 'porcentaje') {
            porcentajeDescuento = descuentoValor;
            precioFinal = precioOriginal * (1 - descuentoValor / 100);
        } else if (descuentoTipo === 'monto') {
            // Convertir a porcentaje para la banda
            porcentajeDescuento = Math.round((descuentoValor / precioOriginal) * 100);
            precioFinal = precioOriginal - descuentoValor;
        } else {
            // Si hay descuento_valor pero no tiene tipo definido, asumir porcentaje
            porcentajeDescuento = descuentoValor;
            precioFinal = precioOriginal * (1 - descuentoValor / 100);
        }
    }
    
    return `
        <div class="product-card ${categoryClass}" data-product-id="${product.id}">
            <!-- Banda de descuento -->
            ${tieneDescuento && porcentajeDescuento > 0 ? `
                <div class="discount-band">
                    <div class="discount-text">${Math.round(porcentajeDescuento)}%</div>
                </div>
            ` : ''}
            
            <!-- Banda de agotado -->
            ${esAgotado ? `
                <div class="out-of-stock-band">
                    <div class="out-of-stock-text">AGOTADO</div>
                </div>
            ` : ''}
            
            <div class="product-image-container">
                <img 
                    src="${imageUrl}" 
                    alt="${product.nombre || product.name || 'Producto'}" 
                    class="product-image"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESin Imagen%3C/text%3E%3C/svg%3E'" 
                    loading="lazy"
                >
            </div>
            
            <div class="product-info">
                <h3 class="product-name">${product.nombre || product.name}</h3>
                ${productCategory ? `<p class="product-category ${categoryClass}">${productCategory}</p>` : ''}
                

                
                <div class="product-footer">
                    <div class="product-price">
                        ${tieneDescuento && porcentajeDescuento > 0 ? `
                            <span class="original-price"><span class="price-currency">$</span><span class="price-value">${formatPrice(precioOriginal)}</span></span>
                            <span class="discounted-price"><span class="price-currency">$</span><span class="price-value">${formatPrice(precioFinal)}</span></span>
                        ` : `
                            <span class="current-price"><span class="price-currency">$</span><span class="price-value">${formatPrice(precioOriginal)}</span></span>
                        `}
                    </div>

                    <button 
                        class="view-detail-btn ${esAgotado ? 'disabled' : ''}"
                        onclick="goToProductDetail('${String(product.id).replace(/'/g, "\\'")}')"
                        ${esAgotado ? 'disabled' : ''}
                    >
                        ${esAgotado ? 'AGOTADO' : 'Ver detalle'}
                    </button>
                </div>
                
                ${(product.cantidad || 0) <= 5 && (product.cantidad || 0) > 0 && !esAgotado ? `
                    <p class="low-stock-warning">¡Solo quedan ${product.cantidad} unidades!</p>
                ` : ''}
            </div>
        </div>
    `;
}

// Manejar búsqueda
function handleSearch() {
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    applyFiltersAndSort();
    renderProducts();
}

// Manejar filtro de categoría
function handleCategoryFilter(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    currentCategory = btn.dataset.category;
    
    // Actualizar botones activos
    const buttons = categoryFiltersContainer.querySelectorAll('.filter-btn');
    buttons.forEach(b => b.classList.toggle('active', b.dataset.category === currentCategory));
    
    applyFiltersAndSort();
    renderProducts();
}

// Aplicar filtros y ordenamiento
function applyFiltersAndSort() {
    // Filtrar
    filteredProducts = allProducts.filter(product => {
        const productCategory = getProductCategory(product);
        // Filtro de categoría
        const matchesCategory = currentCategory === 'all' || productCategory === currentCategory;
        
        // Filtro de búsqueda
        const matchesSearch = !currentSearchTerm || 
            (product.nombre || product.name || '').toLowerCase().includes(currentSearchTerm) ||
            ((product.descripcion || product.description || '').toLowerCase().includes(currentSearchTerm)) ||
            (productCategory.toLowerCase().includes(currentSearchTerm));
        
        return matchesCategory && matchesSearch;
    });

    // Ordenar por nombre ascendente por defecto
    filteredProducts.sort((a, b) => {
        const nameA = (a.nombre || a.name || '').toLowerCase();
        const nameB = (b.nombre || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

function goToProductDetail(productId) {
    if (!productId) return;
    const safeId = encodeURIComponent(productId);
    window.location.href = `product-detail.html?id=${safeId}`;
}

// Funciones auxiliares
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

function formatPrice(price) {
    const numPrice = parseFloat(price);
    // Si el precio es entero, no mostrar decimales
    if (Number.isInteger(numPrice)) {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numPrice);
    }
    // Si tiene decimales, mostrar hasta 2
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numPrice);
}

function calculateDiscountedPrice(price, discount) {
    return price - (price * discount / 100);
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function updateProductsCount(count) {
    productsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

function showLoading() {
    loadingState.style.display = 'flex';
}

function hideLoading() {
    loadingState.style.display = 'none';
}

function showError() {
    errorState.style.display = 'flex';
}

function hideError() {
    errorState.style.display = 'none';
}

function showEmpty() {
    emptyState.style.display = 'flex';
}

function hideEmpty() {
    emptyState.style.display = 'none';
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

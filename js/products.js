// Estado de la aplicación
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSearchTerm = '';
let currentSort = 'name-asc';

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortSelect = document.getElementById('sortSelect');
const filterBtns = document.querySelectorAll('.filter-btn');
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
    
    // Filtros de categoría
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
    
    // Ordenamiento
    sortSelect.addEventListener('change', handleSort);
    
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
                producto_imagenes!inner(url, es_principal)
            `)
            .eq('tipo_venta', 'mayorista')
            .eq('disponible', true)
            .eq('producto_imagenes.es_principal', true)
            .order('nombre', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        allProducts = data || [];
        filteredProducts = [...allProducts];
        
        applyFiltersAndSort();
        renderProducts();
        hideLoading();
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showError();
        hideLoading();
    }
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
    // Extraer URL de imagen de la relación producto_imagenes
    const imageUrl = product.producto_imagenes && product.producto_imagenes.length > 0 
        ? getImageUrl(product.producto_imagenes[0].url)
        : '';
    const inStock = product.disponible === true && (product.cantidad || 0) > 0;
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image-container">
                <img 
                    src="${imageUrl}" 
                    alt="${product.name}" 
                    class="product-image"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESin Imagen%3C/text%3E%3C/svg%3E'"
                    loading="lazy"
                >
                ${!inStock ? '<span class="out-of-stock-badge">Agotado</span>' : ''}
                ${product.descuento || product.oferta ? `<span class="discount-badge">-${product.descuento || product.oferta}%</span>` : ''}
            </div>
            
            <div class="product-info">
                <h3 class="product-name">${product.nombre || product.name}</h3>
                ${(product.categoria || product.category) ? `<p class="product-category">${product.categoria || product.category}</p>` : ''}
                
                ${(product.descripcion || product.description) ? `
                    <p class="product-description">${truncateText(product.descripcion || product.description, 80)}</p>
                ` : ''}
                
                <div class="product-footer">
                    <div class="product-price">
                        ${(product.descuento || product.oferta) ? `
                            <span class="original-price">$${formatPrice(product.precio || product.price)}</span>
                            <span class="discounted-price">$${formatPrice(calculateDiscountedPrice(product.precio || product.price, product.descuento || product.oferta))}</span>
                        ` : `
                            <span class="current-price">$${formatPrice(product.precio || product.price)}</span>
                        `}
                    </div>
                    
                    <button 
                        class="add-to-cart-btn ${!inStock ? 'disabled' : ''}"
                        ${!inStock ? 'disabled' : ''}
                        onclick="addToCart(${product.id})"
                    >
                        ${inStock ? 'Agregar al carrito' : 'Agotado'}
                    </button>
                </div>
                
                ${(product.cantidad || 0) <= 5 && (product.cantidad || 0) > 0 ? `
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
    const btn = e.target;
    currentCategory = btn.dataset.category;
    
    // Actualizar botones activos
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    applyFiltersAndSort();
    renderProducts();
}

// Manejar ordenamiento
function handleSort() {
    currentSort = sortSelect.value;
    applyFiltersAndSort();
    renderProducts();
}

// Aplicar filtros y ordenamiento
function applyFiltersAndSort() {
    // Filtrar
    filteredProducts = allProducts.filter(product => {
        // Filtro de categoría
        const matchesCategory = currentCategory === 'all' || (product.categoria || product.category) === currentCategory;
        
        // Filtro de búsqueda
        const matchesSearch = !currentSearchTerm || 
            (product.nombre || product.name || '').toLowerCase().includes(currentSearchTerm) ||
            ((product.descripcion || product.description || '').toLowerCase().includes(currentSearchTerm)) ||
            ((product.categoria || product.category || '').toLowerCase().includes(currentSearchTerm));
        
        return matchesCategory && matchesSearch;
    });
    
    // Ordenar
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'name-asc':
                return (a.nombre || a.name).localeCompare(b.nombre || b.name);
            case 'name-desc':
                return (b.nombre || b.name).localeCompare(a.nombre || a.name);
            case 'price-asc':
                return (a.precio || a.price) - (b.precio || b.price);
            case 'price-desc':
                return (b.precio || b.price) - (a.precio || a.price);
            default:
                return 0;
        }
    });
}

// Agregar al carrito (placeholder)
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        alert(`"${product.nombre || product.name}" agregado al carrito`);
        // Aquí implementarías la lógica real del carrito
    }
}

// Funciones auxiliares
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

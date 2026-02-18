// Vista de detalle de producto
const state = {
    product: null,
    mainImageUrl: '',
    images: [],
    currentIndex: 0,
};

const ui = {
    loading: document.getElementById('loadingState'),
    error: document.getElementById('errorState'),
    productSection: document.getElementById('productDetail'),
    extraSection: document.getElementById('extraInfo'),
    retryBtn: document.getElementById('retryBtn'),
    breadcrumbName: document.getElementById('breadcrumbName'),
    mainImage: document.getElementById('mainImage'),
    thumbnails: document.getElementById('thumbnails'),
    stockBadge: document.getElementById('stockBadge'),
    discountBadge: document.getElementById('discountBadge'),
    prevBtn: document.getElementById('prevImageBtn'),
    nextBtn: document.getElementById('nextImageBtn'),
    categoryTag: document.getElementById('categoryTag'),
    availability: document.getElementById('availability'),
    productName: document.getElementById('productName'),
    productDescription: document.getElementById('productDescription'),
    currentPrice: document.getElementById('currentPrice'),
    originalPrice: document.getElementById('originalPrice'),
    discountChip: document.getElementById('discountChip'),
    stockCount: document.getElementById('stockCount'),
    saleType: document.getElementById('saleType'),
    categoryValue: document.getElementById('categoryValue'),
    addToCartBtn: document.getElementById('addToCartBtn'),
    contactBtn: document.getElementById('contactBtn'),
    quickDetails: document.getElementById('quickDetails'),
};

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

function showLoading() {
    ui.loading.style.display = 'flex';
    ui.productSection.style.display = 'none';
    if (ui.extraSection) ui.extraSection.style.display = 'none';
    ui.error.style.display = 'none';
}

function showError() {
    ui.loading.style.display = 'none';
    ui.productSection.style.display = 'none';
    if (ui.extraSection) ui.extraSection.style.display = 'none';
    ui.error.style.display = 'flex';
}

function showContent() {
    ui.loading.style.display = 'none';
    ui.error.style.display = 'none';
    ui.productSection.style.display = 'grid';
    if (ui.extraSection) ui.extraSection.style.display = 'grid';
}

function formatPrice(price) {
    const num = Number(price) || 0;
    const opts = Number.isInteger(num)
        ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return new Intl.NumberFormat('es-MX', opts).format(num);
}

function parseStockValue(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function getDiscountInfo(product) {
    const precioOriginal = Number(product.precio_aron ?? product.precio ?? product.price ?? 0);
    const rawValue = Number(product.descuento_valor_aron ?? product.descuento_valor ?? product.descuento ?? product.oferta ?? 0);
    const tipo = String(product.descuento_tipo || 'porcentaje').toLowerCase();
    const toggle = product.tiene_descuento;
    const aplica = toggle === false ? false : (rawValue > 0 && precioOriginal > 0);

    if (!aplica) {
        return {
            precioOriginal,
            precioFinal: precioOriginal,
            porcentaje: 0,
            aplica: false,
        };
    }

    let precioFinal;
    let porcentaje;

    if (tipo === 'monto') {
        precioFinal = precioOriginal - rawValue;
        porcentaje = precioOriginal > 0 ? Math.round((rawValue / precioOriginal) * 100) : 0;
    } else if (tipo === 'fixed') {
        precioFinal = rawValue;
        porcentaje = precioOriginal > 0 ? Math.round(((precioOriginal - rawValue) / precioOriginal) * 100) : 0;
    } else {
        porcentaje = rawValue;
        precioFinal = precioOriginal * (1 - rawValue / 100);
    }

    precioFinal = Math.max(0, Number.isFinite(precioFinal) ? precioFinal : precioOriginal);
    porcentaje = Math.max(0, Math.min(100, Number.isFinite(porcentaje) ? Math.round(porcentaje) : 0));

    // Si el descuento hace que el precio final sea 0 o negativo, no aplicar descuento
    if (precioFinal <= 0) {
        return {
            precioOriginal,
            precioFinal: precioOriginal,
            porcentaje: 0,
            aplica: false,
        };
    }

    return {
        precioOriginal,
        precioFinal,
        porcentaje,
        aplica: true,
    };
}

function renderQuickDetails(product, priceDisplay) {
    if (!ui.quickDetails) return;
    const stockValue = parseStockValue(product.cantidad);
    const stockText = stockValue === null ? 'N/D' : stockValue;
    const rows = [
        { icon: 'fa-badge-percent', text: priceDisplay },
        { icon: 'fa-box', text: `Stock: ${stockText}` },
        { icon: 'fa-tags', text: `Categoria: ${getCategory(product) || 'Sin categoria'}` },
    ];

    ui.quickDetails.innerHTML = rows
        .map(item => `<li><i class="fas ${item.icon}"></i> ${item.text}</li>`)
        .join('');
}

function getCategory(product) {
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

function setMainImage(url) {
    state.mainImageUrl = url;
    ui.mainImage.src = url;
}

function updateActiveThumbnail(index) {
    ui.thumbnails.querySelectorAll('.thumbnail').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === index);
    });
}

function showImageByIndex(index) {
    if (!state.images.length) return;
    const total = state.images.length;
    state.currentIndex = ((index % total) + total) % total;
    const url = state.images[state.currentIndex];
    setMainImage(url);
    updateActiveThumbnail(state.currentIndex);
}

function renderGallery(images) {
    if (!images.length) {
        const placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22480%22 height=%23480%22%3E%3Crect fill=%22%23101010%22 width=%22480%22 height=%23480%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ESin%20imagen%3C/text%3E%3C/svg%3E';
        setMainImage(placeholder);
        state.images = [];
        state.currentIndex = 0;
        return;
    }

    const sorted = [...images].sort((a, b) => (b.es_principal === true) - (a.es_principal === true));
    const normalized = sorted.map(img => getImageUrl(img.url));
    state.images = normalized;
    state.currentIndex = 0;

    showImageByIndex(0);

    const thumbnailsContainer = document.getElementById('thumbnails');
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = normalized.map((url, idx) => `
            <button class="thumbnail ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Ver imagen ${idx + 1}">
                <img src="${url}" alt="Miniatura ${idx + 1}">
            </button>
        `).join('');

        thumbnailsContainer.querySelectorAll('.thumbnail').forEach((thumb) => {
            thumb.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                showImageByIndex(index);
            });
        });
    }

    if (ui.prevBtn) ui.prevBtn.onclick = () => showImageByIndex(state.currentIndex - 1);
    if (ui.nextBtn) ui.nextBtn.onclick = () => showImageByIndex(state.currentIndex + 1);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            showImageByIndex(state.currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            showImageByIndex(state.currentIndex + 1);
        }
    });
}

function renderPricing(product) {
    const pricing = getDiscountInfo(product);
    ui.currentPrice.textContent = `$${formatPrice(pricing.precioFinal)}`;

    if (pricing.aplica && pricing.porcentaje > 0) {
        ui.originalPrice.textContent = `$${formatPrice(pricing.precioOriginal)}`;
        ui.discountChip.style.display = 'inline-flex';
        ui.discountChip.textContent = `- ${pricing.porcentaje}%`;
        ui.discountBadge.textContent = `-${pricing.porcentaje}%`;
        ui.discountBadge.style.display = 'block';
    } else if (pricing.aplica) {
        ui.originalPrice.textContent = `$${formatPrice(pricing.precioOriginal)}`;
        ui.discountChip.style.display = 'inline-flex';
        ui.discountChip.textContent = 'Precio especial';
        ui.discountBadge.textContent = 'Oferta';
        ui.discountBadge.style.display = 'block';
    } else {
        ui.originalPrice.textContent = '';
        ui.discountChip.style.display = 'none';
        ui.discountBadge.style.display = 'none';
    }

    return pricing;
}

function renderAvailability(product, stockValue = parseStockValue(product.cantidad)) {
    const hasFiniteStock = stockValue !== null;
    const inStock = product.disponible === true && !product.agotado && (!hasFiniteStock || stockValue > 0);
    const stockDisplay = hasFiniteStock ? stockValue : (inStock ? 'N/D' : 0);

    ui.stockBadge.textContent = inStock ? 'Disponible' : 'Agotado';
    ui.stockBadge.style.background = inStock ? 'rgba(201, 162, 77, 0.9)' : 'rgba(255, 99, 71, 0.9)';

    ui.availability.textContent = inStock ? 'En stock' : 'No disponible';
    ui.availability.classList.toggle('soldout', !inStock);

    ui.stockCount.textContent = stockDisplay;

    ui.addToCartBtn.disabled = !inStock;
    ui.addToCartBtn.textContent = inStock ? 'Agregar al carrito' : 'Sin stock';
    ui.addToCartBtn.classList.toggle('disabled', !inStock);

    ui.contactBtn.disabled = !inStock;
    ui.contactBtn.textContent = inStock ? 'Consultar disponibilidad' : 'Producto agotado';
    ui.contactBtn.classList.toggle('disabled', !inStock);
}

function renderProduct(product) {
    state.product = product;
    const category = getCategory(product);
    const stockLimit = parseStockValue(product.cantidad);
    const pricing = renderPricing(product);

    ui.breadcrumbName.textContent = product.nombre || product.name || 'Producto';
    ui.productName.textContent = product.nombre || product.name || 'Producto';
    ui.productDescription.textContent = product.descripcion || product.description || 'Fragancia exclusiva disponible en Aron.';
    ui.categoryTag.textContent = category || 'Categoria';
    ui.categoryValue.textContent = category || 'Sin categoria';
    ui.saleType.textContent = product.tipo_venta || 'Sin dato';

    renderGallery(product.producto_imagenes || []);
    renderAvailability(product, stockLimit);
    renderQuickDetails(product, `Precio final: $${formatPrice(pricing.precioFinal)}`);

    const categoryClass = getCategoryClass(category);
    ui.categoryTag.classList.remove('cat-male', 'cat-female', 'cat-unisex', 'cat-niche', 'cat-default');
    ui.categoryTag.classList.add(categoryClass);

    ui.addToCartBtn.onclick = () => {
        addToCart(
            product.id,
            product.nombre || product.name,
            pricing.precioFinal,
            state.mainImageUrl,
            stockLimit
        );
    };

    ui.contactBtn.onclick = () => {
        const text = encodeURIComponent(`Hola, quiero consultar disponibilidad de ${product.nombre || product.name}.`);
        window.open(`https://wa.me/573188014404?text=${text}`, '_blank');
    };

    showContent();
}

async function loadProduct() {
    if (!productId) {
        showError();
        return;
    }

    try {
        showLoading();
        const { data, error } = await supabaseClient
            .from('productos')
            .select(`*, producto_imagenes (url, es_principal), categorias:categoria_id (nombre)`) 
            .eq('id', productId)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Producto no encontrado');

        renderProduct(data);
    } catch (err) {
        console.error('No se pudo cargar el detalle', err);
        showError();
    }
}

function init() {
    ui.retryBtn?.addEventListener('click', loadProduct);
    updateCartCount();
    loadProduct();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

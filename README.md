# Aron Fragancias - e-commerce de Perfumes

Sitio web de e-commerce para venta de perfumes utilizando Supabase como base de datos y Cloudflare R2 para almacenamiento de imágenes.

## 🚀 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Base de datos**: Supabase
- **Almacenamiento de imágenes**: Cloudflare R2
- **Diseño**: Responsive, mobile-first

## 📁 Estructura del Proyecto

```
aron-fragancias/
├── index.html                  # Página de inicio
├── pages/
│   └── products.html          # Catálogo de productos
├── js/
│   ├── config.js              # Configuración de Supabase y R2
│   └── products.js            # Lógica de productos
├── css/
│   └── products.css           # Estilos del catálogo
└── README.md                  # Documentación
```

## ⚙️ Configuración

### 1. Configurar Supabase

Edita `js/config.js` y reemplaza `YOUR_SUPABASE_ANON_KEY` con tu clave anónima de Supabase:

```javascript
const SUPABASE_ANON_KEY = 'tu_clave_aqui';
```

### 2. Estructura de la tabla `products` en Supabase

Crea una tabla llamada `products` con las siguientes columnas:

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Configurar Cloudflare R2

Las imágenes se almacenan en Cloudflare R2. La URL base ya está configurada en `config.js`:

```javascript
const R2_BASE_URL = 'https://pub-9f8783e25b4a4740aa06141ce640d277.r2.dev';
```

## 🎨 Características

### Página de Productos (`products.html`)

- ✅ **Cuadrícula responsiva** de productos
- ✅ **Búsqueda en tiempo real** por nombre, descripción o categoría
- ✅ **Filtros por categoría**: Todos, Hombre, Mujer, Unisex, Nicho
- ✅ **Ordenamiento**: Por nombre (A-Z, Z-A) o precio (menor/mayor)
- ✅ **Carga de imágenes** desde Cloudflare R2
- ✅ **Estados visuales**:
  - Productos agotados
  - Productos con descuento
  - Advertencia de stock bajo (≤ 5 unidades)
- ✅ **Estados de carga**:
  - Loading spinner
  - Mensaje de error con botón de reintento
  - Estado vacío cuando no hay resultados

## 🌐 Uso

1. Abre `index.html` en tu navegador
2. Haz clic en "Ver Catálogo de Productos"
3. Explora los productos disponibles

## 📝 Campos de Producto

Cada producto en la base de datos debe tener:

- `id`: ID único (auto-generado)
- `name`: Nombre del producto (requerido)
- `description`: Descripción del producto (opcional)
- `price`: Precio (requerido)
- `category`: Categoría (Hombre, Mujer, Unisex, Nicho)
- `image_url`: Ruta de la imagen en R2 (ej: "products/perfume1.jpg")
- `stock`: Cantidad disponible (default: 0)
- `discount`: Porcentaje de descuento (0-100, default: 0)

## 🔄 Próximas Funcionalidades

- [ ] Carrito de compras funcional
- [ ] Sistema de autenticación
- [ ] Página de detalles de producto
- [ ] Checkout y procesamiento de pagos
- [ ] Panel de administración
- [ ] Historial de pedidos

## 🎯 Ejemplo de Datos

```javascript
// Ejemplo de producto en Supabase
{
  id: 1,
  name: "Dior Sauvage",
  description: "Fragancia fresca y especiada para hombre",
  price: 1299.00,
  category: "Hombre",
  image_url: "products/dior-sauvage.jpg",
  stock: 15,
  discount: 10
}
```

## 📱 Responsive Design

El sitio es completamente responsivo y se adapta a:

- 📱 Móviles (< 480px): 1 columna
- 📱 Tablets (480px - 768px): 2 columnas
- 💻 Desktop (> 768px): Grid flexible de 3-4 columnas

## 🛠️ Personalización

### Cambiar colores

Edita las variables CSS en `css/products.css`:

```css
:root {
    --primary-color: #6366f1;
    --primary-hover: #4f46e5;
    --secondary-color: #8b5cf6;
    /* ... más colores */
}
```

### Añadir categorías

En `products.html`, agrega botones de filtro:

```html
<button class="filter-btn" data-category="Nueva">Nueva Categoría</button>
```

## 📄 Licencia

Este proyecto es de uso privado para Aron Fragancias.

---

**Desarrollado con ❤️ para Aron Fragancias**

// Configuración de Supabase
const SUPABASE_URL = 'https://otlynjzdpyugesqmptcb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bHluanpkcHl1Z2VzcW1wdGNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA4MTA5MCwiZXhwIjoyMDgzNjU3MDkwfQ.iURXSA3Cc9rIawkREfxP_SK0tr4NvCR2Zx4nq4mwD2A';

// Configuración de Cloudflare R2
const R2_BASE_URL = 'https://jnperfume-upload.jnperfumes31.workers.dev';

// Inicializar cliente de Supabase
let supabaseClient;
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase library not loaded');
}

// Función auxiliar para construir URLs de imágenes
function getImageUrl(imagePath) {
    if (!imagePath) return '';
    
    // Si la ruta ya es una URL completa, codificar espacios si es necesario
    if (imagePath.startsWith('http')) {
        // Reemplazar espacios por %20 en la URL
        return imagePath.replace(/ /g, '%20');
    }
    
    // Eliminar barras al inicio si existen
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Codificar la ruta y construir la URL con R2
    const encodedPath = cleanPath.replace(/ /g, '%20');
    return `${R2_BASE_URL}/${encodedPath}`;
}

// Configuración de Supabase
const SUPABASE_URL = 'https://otlynjzdpyugesqmptcb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bHluanpkcHl1Z2VzcW1wdGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODEwOTAsImV4cCI6MjA4MzY1NzA5MH0.RtJEeFxX6S314z2wrGrK3LrGTJbky_RZAgdfaxlS3HU';

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
    
    // Codificar la ruta
    const encodedPath = cleanPath.replace(/ /g, '%20');
    return `${encodedPath}`;
}

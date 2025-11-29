/**
 * Content Loader - Templo de Sabiduría
 * Carga el contenido desde posts.yaml y genera el HTML dinámicamente
 */

// Librería simple para parsear YAML (inline, sin dependencias externas)
const parseYAML = (yamlText) => {
    const lines = yamlText.split('\n');
    const result = { posts: [] };
    let currentSection = null;
    let currentPost = null;
    let indent = 0;

    for (let line of lines) {
        // Ignorar comentarios y líneas vacías
        if (line.trim().startsWith('#') || line.trim() === '') continue;

        // Detectar nivel de indentación
        const currentIndent = line.search(/\S/);

        // Sección principal (featured o posts)
        if (currentIndent === 0 && line.includes(':')) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key === 'featured') {
                currentSection = 'featured';
                result.featured = {};
                currentPost = result.featured;
            } else if (key === 'posts') {
                currentSection = 'posts';
            }
            continue;
        }

        // Nuevo item en array de posts
        if (line.trim().startsWith('- ')) {
            currentPost = {};
            result.posts.push(currentPost);
            // Extraer el primer campo
            const content = line.substring(line.indexOf('-') + 1).trim();
            if (content.includes(':')) {
                const [key, value] = content.split(':').map(s => s.trim());
                currentPost[key] = value.replace(/['"]/g, '');
            }
            continue;
        }

        // Campos dentro de un objeto
        if (currentPost && line.includes(':')) {
            const [key, ...valueParts] = line.split(':');
            let value = valueParts.join(':').trim();

            // Limpiar comillas y null
            value = value.replace(/^["']|["']$/g, '');
            if (value === 'null') value = null;

            currentPost[key.trim()] = value;
        }
    }

    return result;
};

// Cargar y renderizar el contenido
async function loadContent() {
    try {
        const response = await fetch('posts.yaml');
        const yamlText = await response.text();
        const data = parseYAML(yamlText);

        // Renderizar featured post
        if (data.featured) {
            renderFeaturedPost(data.featured);
        }

        // Renderizar posts grid
        if (data.posts && data.posts.length > 0) {
            renderPostsGrid(data.posts);
        }

        console.log('✅ Contenido cargado desde posts.yaml');
    } catch (error) {
        console.error('❌ Error cargando contenido:', error);
        // Si falla, el HTML estático sigue siendo visible
    }
}

// Renderizar el post destacado
function renderFeaturedPost(featured) {
    const featuredCard = document.querySelector('.featured-card');
    if (!featuredCard) return;

    const imageHtml = featured.image
        ? `<img src="${featured.image}" alt="${featured.title}" style="width:100%; border-radius:12px;">`
        : `<div class="placeholder-image">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="url(#grad1)"/>
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <text x="100" y="100" text-anchor="middle" fill="white" font-size="60" font-family="monospace">${featured.icon || '🔒'}</text>
            </svg>
        </div>`;

    featuredCard.innerHTML = `
        <div class="featured-badge">Destacado</div>
        <div class="featured-content">
            <h3>${featured.title}</h3>
            <p class="featured-meta">
                <span class="meta-item">📅 ${formatDate(featured.date)}</span>
                <span class="meta-item">🏷️ ${featured.category}</span>
                <span class="meta-item">⏱️ ${featured.readTime}</span>
            </p>
            <p class="featured-description">
                ${featured.description}
            </p>
            <a href="${featured.link}" class="btn-primary">Leer Writeup</a>
        </div>
        <div class="featured-image">
            ${imageHtml}
        </div>
    `;
}

// Renderizar el grid de posts
function renderPostsGrid(posts) {
    const grid = document.querySelector('.writeups-grid');
    if (!grid) return;

    grid.innerHTML = posts.map(post => `
        <article class="writeup-card">
            <div class="card-header">
                <div class="card-icon">${post.icon || '📝'}</div>
                <span class="card-category">${post.category}</span>
            </div>
            <h3 class="card-title">${post.title}</h3>
            <p class="card-description">
                ${post.description}
            </p>
            <div class="card-footer">
                <span class="card-date">${formatDate(post.date)}</span>
                <a href="${post.link}" class="card-link">Leer más →</a>
            </div>
        </article>
    `).join('');

    // Re-aplicar animaciones
    applyScrollAnimations();
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Re-aplicar animaciones de scroll
function applyScrollAnimations() {
    const cards = document.querySelectorAll('.writeup-card');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    cards.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Cargar contenido cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
} else {
    loadContent();
}

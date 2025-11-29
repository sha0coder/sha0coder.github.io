/**
 * Templo de Sabiduría - Interactive Features
 * Vanilla JavaScript for navigation, scroll effects, and interactions
 */

// ========================================
// Navigation Scroll Effect
// ========================================

const nav = document.getElementById('nav');
const hero = document.getElementById('hero');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const heroHeight = hero.offsetHeight;
    
    // Show nav after scrolling past hero
    if (currentScroll > heroHeight * 0.8) {
        nav.classList.add('visible');
    } else {
        nav.classList.remove('visible');
    }
    
    lastScroll = currentScroll;
});

// ========================================
// Smooth Scroll for Navigation Links
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for nav height
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Update active nav link
            updateActiveNavLink(this);
        }
    });
});

// ========================================
// Active Navigation Link
// ========================================

function updateActiveNavLink(clickedLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (clickedLink.classList.contains('nav-link')) {
        clickedLink.classList.add('active');
    }
}

// Update active link on scroll
const sections = document.querySelectorAll('section, header');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ========================================
// Card Hover Effects Enhancement
// ========================================

const cards = document.querySelectorAll('.writeup-card');

cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ========================================
// Scroll Reveal Animation
// ========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.writeup-card, .featured-card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ========================================
// Particle Animation Enhancement
// ========================================

const particles = document.querySelectorAll('.particle');

// Add random starting positions
particles.forEach(particle => {
    const randomX = Math.random() * window.innerWidth;
    const randomY = Math.random() * window.innerHeight;
    particle.style.left = randomX + 'px';
    particle.style.top = randomY + 'px';
});

// ========================================
// Temple Icon Interaction
// ========================================

const templeIcon = document.querySelector('.temple-icon');

if (templeIcon) {
    templeIcon.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(5deg)';
    });
    
    templeIcon.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
    });
}

// ========================================
// Scroll Indicator Click
// ========================================

const scrollIndicator = document.querySelector('.scroll-indicator');

if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const writeupSection = document.getElementById('writeups');
        if (writeupSection) {
            writeupSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ========================================
// Dynamic Year in Footer
// ========================================

const currentYear = new Date().getFullYear();
const footerText = document.querySelector('.footer-bottom p');
if (footerText) {
    footerText.textContent = footerText.textContent.replace('2025', currentYear);
}

// ========================================
// Performance: Reduce animations on mobile
// ========================================

if (window.innerWidth < 768) {
    document.querySelectorAll('.particle').forEach(particle => {
        particle.style.animation = 'float 40s infinite'; // Slower on mobile
    });
}

// ========================================
// Console Easter Egg
// ========================================

console.log('%c🏛️ Templo de Sabiduría', 'font-size: 24px; font-weight: bold; color: #9333ea;');
console.log('%cBienvenido al código fuente. Explora y aprende.', 'font-size: 14px; color: #a855f7;');
console.log('%cGitHub: sha0coder', 'font-size: 12px; color: #d1d5db;');

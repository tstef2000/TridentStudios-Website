// ========================================
// Trident Studios - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Setup login button - redirects to login page
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // Make closePortfolio available globally
    window.closePortfolio = function() {
        const portfolioSections = document.querySelectorAll('.artist-portfolio-section');
        portfolioSections.forEach(section => {
            section.classList.add('hidden');
        });
        window.location.hash = '';
    };

    // Replay any autoplay videos when tab becomes visible again
    // (browsers may pause autoplay videos when tab is hidden)
    function replayAutoplayVideos() {
        document.querySelectorAll('video[autoplay]').forEach(video => {
            if (video.paused && !video.ended) {
                video.play().catch(() => {});
            }
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            replayAutoplayVideos();
        }
    });

    // pageshow fires when returning via browser back button
    window.addEventListener('pageshow', (e) => {
        // e.persisted = page was restored from bfcache
        replayAutoplayVideos();
    });

    // Initialize all systems
    setupNavigation();
    setupFormSubmission();

    // Portfolio renders first so reveal observers can include loaded items.
    loadPortfolioShowcase().finally(() => {
        setupPortfolioReveal();
    });
});

async function loadPortfolioShowcase() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    try {
        let response = await fetch('/api/portfolio.php?ts=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) {
            response = await fetch('data/portfolio-showcase.json?ts=' + Date.now(), { cache: 'no-store' });
        }
        if (!response.ok) return;

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (!items.length) return;

        grid.innerHTML = '';
        items.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'portfolio-item';

            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'portfolio-image';

            if ((item.mediaType || '').toLowerCase() === 'video' && item.mediaUrl) {
                // Lazy video: placeholder until in view
                const video = document.createElement('video');
                video.className = 'portfolio-media portfolio-media-video';
                video.setAttribute('playsinline', '');
                video.setAttribute('muted', '');
                video.setAttribute('loop', '');
                video.setAttribute('disablepictureinpicture', '');
                video.setAttribute('disableremoteplayback', '');
                video.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
                video.defaultMuted = true;
                video.muted = true;
                video.volume = 0;
                video.poster = item.poster || '';
                video.dataset.src = item.mediaUrl;
                video.dataset.type = item.mimeType || 'video/mp4';
                // Only load source when in view
                mediaWrap.appendChild(video);
            } else if ((item.mediaType || '').toLowerCase() === 'link' && item.mediaUrl) {
                const link = document.createElement('a');
                link.className = 'portfolio-media-link';
                link.href = item.mediaUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.innerHTML = '<i class="fas fa-up-right-from-square"></i><span>Open Project Link</span>';
                mediaWrap.appendChild(link);
            } else if (item.mediaUrl) {
                const img = document.createElement('img');
                img.className = 'portfolio-media';
                img.src = item.mediaUrl;
                img.alt = item.alt || item.title || 'Portfolio preview';
                img.loading = 'lazy';
                img.decoding = 'async';
                mediaWrap.appendChild(img);
            } else {
                mediaWrap.innerHTML = '<i class="fas fa-image"></i>';
            }

            const title = document.createElement('h3');
            title.textContent = item.title || 'Portfolio Item';
            const description = document.createElement('p');
            description.textContent = item.description || '';

            card.appendChild(mediaWrap);
            card.appendChild(title);
            card.appendChild(description);
            grid.appendChild(card);
        });

        optimizePortfolioVideos(grid);
    } catch (error) {
        console.warn('Failed to load portfolio showcase config:', error);
    }
}

function optimizePortfolioVideos(container) {
    const videos = container.querySelectorAll('video.portfolio-media-video');
    if (!videos.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // If not loaded, add source and autoplay
                if (!video.dataset.loaded) {
                    const source = document.createElement('source');
                    source.src = video.dataset.src;
                    source.type = video.dataset.type;
                    video.appendChild(source);
                    video.load();
                    video.dataset.loaded = 'true';
                }
                video.currentTime = 0;
                video.play().catch(() => {});
            } else {
                if (!video.paused) video.pause();
            }
        });
    }, {
        rootMargin: '200px 0px 200px 0px',
        threshold: 0.2
    });

    videos.forEach((video) => observer.observe(video));
}

// ========================================
// Navigation
// ========================================

function setupNavigation() {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close mobile menu when link is clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar Shadow on Scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 10px 30px rgba(var(--primary-rgb), 0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // Keyboard Navigation - Close menu on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const navMenu = document.querySelector('.nav-menu');
            const hamburger = document.querySelector('.hamburger');
            if (navMenu) navMenu.classList.remove('active');
            if (hamburger) hamburger.classList.remove('active');
        }
    });
}

// ========================================
// Scroll Animations
// ========================================

// New: Reveal all portfolio items at once when section is 25% in view
function setupPortfolioReveal() {
    const section = document.querySelector('.portfolio');
    const items = document.querySelectorAll('.portfolio-item');
    if (!section || !items.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                items.forEach(item => item.classList.add('is-revealed'));
                observer.disconnect();
            }
        });
    }, {
        rootMargin: '0px 0px -75% 0px', // 25% from top
        threshold: 0.01
    });
    observer.observe(section);

    // Parallax Effect for particles — use rAF for smooth, performant updates
    const particles = Array.from(document.querySelectorAll('.particle'));
    let lastScroll = window.pageYOffset;
    let ticking = false;
    function updateParticles() {
        const scrolled = window.pageYOffset;
        particles.forEach((particle, index) => {
            const speed = (index + 1) * 0.35;
            particle.style.transform = `translateY(${scrolled * speed}px)`;
        });
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateParticles);
            ticking = true;
        }
    }, { passive: true });

    // Animate counters in about section
    const aboutStats = document.querySelector('.about-stats');
    if (aboutStats) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.35, rootMargin: '0px 0px -20% 0px' });
        statsObserver.observe(aboutStats);
    }

    // Add subtle animated backgrounds to sections that are visually plain
    document.querySelectorAll('.portfolio, .services, .about, .contact').forEach(sec => {
        sec.classList.add('bg-animated');
    });
}

function animateCounters() {
    const stats = document.querySelectorAll('.stat h4');
    
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        const suffix = stat.textContent.replace(/[0-9]/g, '').trim();
        let count = 0;
        const increment = target / 30;
        
        const counter = setInterval(() => {
            count += increment;
            if (count >= target) {
                stat.textContent = target + suffix;
                clearInterval(counter);
            } else {
                stat.textContent = Math.floor(count) + suffix;
            }
        }, 30);
    });
}

// ========================================
// Form Submission
// ========================================

function setupFormSubmission() {
    // Contact form handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const discord = this.querySelectorAll('input[type="text"]')[1]?.value || '';
            const service = this.querySelector('select')?.value || '';
            const message = this.querySelector('textarea').value;

            // Validate form
            if (!name || !email || !service || !message) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Show success message
            showFormSuccess();
            this.reset();
        });
    }

    // Portfolio link functionality
    const portfolioLinks = document.querySelectorAll('.portfolio-link');
    portfolioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Initialize portfolio visibility on page load
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        const portfolioSections = document.querySelectorAll('.artist-portfolio-section');
        
        portfolioSections.forEach(section => {
            if (section.id === hash.substring(1)) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
    });
}

function showFormSuccess() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const message = document.createElement('div');
    message.className = 'form-success';
    message.textContent = 'Thank you! We\'ll get back to you soon.';
    message.style.cssText = `
        padding: 15px 20px;
        background: #4CAF50;
        color: white;
        border-radius: 5px;
        margin-bottom: 20px;
        text-align: center;
        animation: slideDown 0.3s ease;
    `;

    form.insertBefore(message, form.firstChild);

    setTimeout(() => {
        message.remove();
    }, 5000);
}

// ========================================
// Utility Functions
// ========================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? '#c1434f' : '#4CAF50'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 3000;
        animation: slideInDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========================================
// Initialization Complete
// ========================================

console.log('✓ Trident Studios website loaded successfully!');

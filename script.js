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

    // Initialize all systems
    setupNavigation();
    setupScrollAnimations();
    setupFormSubmission();
});

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

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideInUp 0.8s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.service-card, .portfolio-item, .artist-card, .artist-social-card, .studio-social-link, .about-content, .official-server-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Parallax Effect for particles
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const particles = document.querySelectorAll('.particle');

        particles.forEach((particle, index) => {
            const speed = (index + 1) * 0.5;
            particle.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

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
        }, observerOptions);
        statsObserver.observe(aboutStats);
    }
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

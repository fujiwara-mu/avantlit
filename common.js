// 前衛小説報告書 - 共通JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navContainer = document.querySelector('.nav-container');
    const dropdownToggles = document.querySelectorAll('.dropdown .dropdown-toggle');
    const bookstoreDropdowns = document.querySelectorAll('.bookstore-dropdown');

    // --- Menu Logic ---

    // Hamburger Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
        });
    }

    // Submenu Toggles (Mobile)
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            e.stopPropagation();
            const parentDropdown = toggle.closest('.dropdown');
            const wasActive = parentDropdown.classList.contains('active');
            // Close all other submenus
            document.querySelectorAll('.dropdown.active').forEach(d => {
                if (d !== parentDropdown) d.classList.remove('active');
            });
            // Toggle the clicked one
            parentDropdown.classList.toggle('active');
        });
    });

    // Bookstore Dropdown Toggles
    bookstoreDropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.bookstore-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const parent = trigger.closest('.bookstore-dropdown');
                const menu = parent.querySelector('.bookstore-menu');
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

                // Close all other bookstore dropdowns
                document.querySelectorAll('.bookstore-dropdown').forEach(d => {
                    if (d !== parent) {
                        d.querySelector('.bookstore-trigger')?.setAttribute('aria-expanded', 'false');
                        d.querySelector('.bookstore-menu')?.classList.remove('open');
                    }
                });

                // Toggle the clicked one
                trigger.setAttribute('aria-expanded', !isExpanded);
                menu.classList.toggle('open');
            });
        }
    });

    // --- Global Click Listener to Close Menus ---
    document.addEventListener('click', (e) => {
        // Close main nav menu if click is outside the nav container
        if (navMenu && navMenu.classList.contains('active') && !navContainer.contains(e.target)) {
            navMenu.classList.remove('active');
            document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
        }

        // Close bookstore dropdowns if click is outside
        if (!e.target.closest('.bookstore-dropdown')) {
            document.querySelectorAll('.bookstore-dropdown').forEach(d => {
                d.querySelector('.bookstore-trigger')?.setAttribute('aria-expanded', 'false');
                d.querySelector('.bookstore-menu')?.classList.remove('open');
            });
        }
    });


    // --- Other Functionalities (no changes needed here) ---

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (navMenu) navMenu.classList.remove('active');
            }
        });
    });

    // Scroll Top Button & Progress Bar
    const scrollTop = document.getElementById('scrollTop');
    if (scrollTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTop.classList.add('show');
            } else {
                scrollTop.classList.remove('show');
            }
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight - windowHeight;
                const scrolled = window.pageYOffset;
                const progress = (scrolled / documentHeight) * 100;
                progressBar.style.width = progress + '%';
            }
        });
        scrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Set Active Nav State
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
            const parentDropdown = link.closest('.dropdown');
            if (parentDropdown) {
                parentDropdown.querySelector('.dropdown-toggle').classList.add('active');
            }
        }
    });

    // Fade-in Animation
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100);
    });
});

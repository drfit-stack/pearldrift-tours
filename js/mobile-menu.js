(() => {
    const menu = document.getElementById('nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menuIcon = document.getElementById('menu-icon');
    const mobileViewport = window.matchMedia('(max-width: 768px)');

    if (!menu || !toggle || !menuIcon) return;

    function syncMenuVisibility() {
        const hidden = mobileViewport.matches && !menu.classList.contains('active');
        menu.inert = hidden;

        if (hidden) {
            menu.setAttribute('aria-hidden', 'true');
        } else {
            menu.removeAttribute('aria-hidden');
        }
    }

    function updateCurrentLink() {
        const currentUrl = new URL(window.location.href);
        const isListingPage = ['local', 'divesaf', 'spec'].includes(document.documentElement.dataset.page);
        const toursUrl = new URL('index.html#tours', currentUrl);

        menu.querySelectorAll('a[href]').forEach(link => {
            link.removeAttribute('aria-current');

            const targetUrl = new URL(link.href, currentUrl);
            if (isListingPage && targetUrl.href === toursUrl.href) {
                setCurrentLink(link, targetUrl);
                return;
            }
            if (targetUrl.pathname !== currentUrl.pathname) return;

            if (targetUrl.hash) {
                if (targetUrl.hash === currentUrl.hash) setCurrentLink(link, targetUrl);
            } else {
                setCurrentLink(link, targetUrl);
            }
        });
    }

    function setCurrentLink(link, targetUrl) {
        menu.querySelectorAll('a[aria-current]').forEach(current => current.removeAttribute('aria-current'));
        link.setAttribute('aria-current', targetUrl.hash ? 'location' : 'page');
    }

    function closeMobileMenu(restoreFocus = false) {
        menu.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');

        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        menuIcon.textContent = '☰';
        syncMenuVisibility();

        if (restoreFocus) toggle.focus({ preventScroll: true });
    }

    function openMobileMenu() {
        if (!mobileViewport.matches || menu.classList.contains('active')) return;

        menu.inert = false;
        menu.removeAttribute('aria-hidden');
        menu.classList.add('active');
        document.body.classList.add('mobile-menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        menuIcon.textContent = '×';

        window.requestAnimationFrame(() => {
            menu.querySelector('li:not(.back-desktop) > a[href]')?.focus({ preventScroll: true });
        });
    }

    toggle.addEventListener('click', () => {
        if (menu.classList.contains('active')) {
            closeMobileMenu(true);
        } else {
            openMobileMenu();
        }
    });

    document.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        if (!menu.classList.contains('active')) return;

        const link = target.closest('a');
        if (menu.contains(target) && link) {
            const targetUrl = new URL(link.href, window.location.href);
            if (targetUrl.pathname === window.location.pathname) setCurrentLink(link, targetUrl);
            closeMobileMenu();
        } else if (!menu.contains(target) && !toggle.contains(target)) {
            closeMobileMenu();
        }
    });

    document.addEventListener('focusin', event => {
        if (
            menu.classList.contains('active') &&
            !menu.contains(event.target) &&
            !toggle.contains(event.target)
        ) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.classList.contains('active')) {
            event.preventDefault();
            closeMobileMenu(true);
        }
    });

    const handleViewportChange = () => {
        if (!mobileViewport.matches) {
            const menuHadFocus = menu.contains(document.activeElement);
            closeMobileMenu();
            if (menuHadFocus) menu.querySelector('a[href]')?.focus({ preventScroll: true });
        } else {
            syncMenuVisibility();
        }
    };

    if (mobileViewport.addEventListener) {
        mobileViewport.addEventListener('change', handleViewportChange);
    } else {
        mobileViewport.addListener(handleViewportChange);
    }

    window.addEventListener('hashchange', updateCurrentLink);
    syncMenuVisibility();
    updateCurrentLink();
})();

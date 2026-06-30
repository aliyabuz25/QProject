import { renderIntro, renderOnboarding } from '../views/onboarding.js';
import { renderLogin } from '../views/login.js';
import { renderSignup } from '../views/signup.js';
import { renderOtp } from '../views/otp.js';
import { renderSubscription } from '../views/subscription.js';
import { renderHome } from '../views/home.js';
import { renderStoryDetail } from '../views/story.js';
import { renderPlayer } from '../views/player.js';
import { renderVideoPlayer } from '../views/videoPlayer.js';
import { renderSearch } from '../views/search.js';
import { renderSettings } from '../views/settings.js';
import { renderAudioLibrary } from '../views/audio.js';
import { renderShop } from '../views/shop.js';
import { renderNotifications } from '../views/notifications.js';
import { renderAvatar } from '../views/avatar.js';
import { renderProduct } from '../views/product.js';
import { renderFavorites } from '../views/favorites.js';
import { renderAccount } from '../views/account.js';
import { TABS } from '../components/tabbar.js';
import { auth } from '../services/api.js';

// ── Route map ─────────────────────────────────────────────────────────────────
const routes = {
    '':               renderIntro,        // empty hash → splash first (never blank)
    '#intro':         renderIntro,
    '#onboarding':    renderOnboarding,
    '#login':         renderLogin,
    '#signup':        renderSignup,
    '#otp':           renderOtp,
    '#subscription':  renderSubscription,
    '#home':          renderHome,
    '#story':         renderStoryDetail,
    '#books':         renderStoryDetail,
    '#audio':         renderAudioLibrary,
    '#game':          renderShop,
    '#shop':          renderShop,
    '#profile':       renderSettings,
    '#player':        renderPlayer,
    '#video-player':  renderVideoPlayer,
    '#search':        renderSearch,
    '#notifications': renderNotifications,
    '#avatar':        renderAvatar,
    '#product':       renderProduct,
    '#favorites':     renderFavorites,
    '#account':       renderAccount,
};

// ── Explicit back-navigation map ──────────────────────────────────────────────
// Every screen has a defined "back" destination.
// This is the single source of truth — no screen ever calls window.history.back().
const BACK_MAP = {
    '#intro':         '#onboarding',
    '#onboarding':    null,              // exit app (handled in main.js)
    '#login':         '#onboarding',
    '#signup':        '#onboarding',
    '#otp':           '#signup',
    '#subscription':  '#otp',
    '#home':          null,              // exit app
    '#story':         '#home',
    '#books':         '#home',
    '#audio':         '#home',
    '#game':          '#home',
    '#shop':          '#home',
    '#profile':       '#home',
    '#player':        '#audio',
    '#video-player':  '#story',
    '#search':        '#home',
    '#notifications': '#profile',
    '#avatar':        '#profile',
    '#product':       '#shop',
    '#favorites':     '#profile',
    '#account':       '#profile',
    '':               '#onboarding',
};

// Tab routes that show the bottom nav
const TAB_BAR_ROUTES = new Set(['#home', '#story', '#books', '#audio', '#game', '#shop', '#profile']);

// Routes that must NOT scroll (fixed single-screen layouts, or layouts with internal scroll)
const NO_SCROLL_ROUTES = new Set(['#profile', '#story', '#books', '#audio', '#subscription', '#video-player', '#favorites', '#account']);

const HASH_TO_TAB = {
    '#home':    'home',
    '#story':   'story',
    '#audio':   'audio',
    '#game':    'shop',
    '#shop':    'shop',
    '#profile': 'profile',
};

function getTabIndex(hash) {
    const tabId = hash === '#books' ? 'story' : HASH_TO_TAB[hash];
    return TABS.findIndex(tab => tab.id === tabId);
}

// ── App shell ─────────────────────────────────────────────────────────────────
let _shellBuilt = false;
let _pageContent = null;
let _bottomNav = null;
let _tabTransitionAnimation = null;

function playTabTransition(view, previousHash, nextHash) {
    const previousIndex = getTabIndex(previousHash);
    const nextIndex = getTabIndex(nextHash);
    const reduceMotion = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
        reduceMotion
        || previousIndex < 0
        || nextIndex < 0
        || previousIndex === nextIndex
        || typeof view.animate !== 'function'
    ) return;

    _tabTransitionAnimation?.cancel();

    const direction = nextIndex > previousIndex ? 1 : -1;
    view.style.willChange = 'transform, opacity';

    const animation = view.animate([
        {
            opacity: 0.88,
            transform: `translate3d(${direction * 14}px, 0, 0) scale(0.995)`,
        },
        {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
        },
    ], {
        duration: 220,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
    });

    _tabTransitionAnimation = animation;
    const cleanup = () => {
        view.style.removeProperty('will-change');
        if (_tabTransitionAnimation === animation) _tabTransitionAnimation = null;
    };
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
}

function buildShell() {
    if (_shellBuilt) return;
    _shellBuilt = true;

    const app = document.getElementById('app');
    app.innerHTML = '';
    app.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:visible;background:var(--bg-dark);';

    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.style.cssText = [
        'position:relative;',
        'width:100%;',
        'height:100dvh;',
        'overflow:hidden;',
        'background:var(--bg-dark);',
    ].join('');

    _pageContent = document.createElement('main');
    _pageContent.id = 'page-content';
    _pageContent.style.cssText = [
        'height:100dvh;',
        'overflow-y:auto;',
        'overflow-x:hidden;',
        '-webkit-overflow-scrolling:touch;',
        'padding-bottom:calc(110px + env(safe-area-inset-bottom,0px));',
        'box-sizing:border-box;',
    ].join('');

    shell.appendChild(_pageContent);
    app.appendChild(shell);

    _bottomNav = buildBottomNav('home');
    app.appendChild(_bottomNav);
}

function buildBottomNav(activeTab) {
    const ACTIVE = '#fec348';
    const INACTIVE = '#9da3ad';

    const nav = document.createElement('nav');
    nav.id = 'global-bottom-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');
    nav.dataset.activeTab = activeTab;
    nav.style.cssText = [
        'position:fixed;',
        'left:0;right:0;bottom:0;',
        'height:calc(96px + env(safe-area-inset-bottom,0px));',
        'padding-bottom:env(safe-area-inset-bottom,0px);',
        'z-index:9999;',
        'background:var(--bg-dark);',
        'border-top:1px solid rgba(255,255,255,0.08);',
        'display:none;',
    ].join('');

    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    const pillLeft = activeIdx >= 0 ? `${(activeIdx / TABS.length) * 100}%` : '0%';
    const pillWidth = `${100 / TABS.length}%`;

    nav.innerHTML = `
        <style>
            #global-bottom-nav .bnav-inner {
                height: 84px;
                padding-top: 12px;
                display: flex;
                justify-content: space-around;
                align-items: flex-start;
                padding-left: 8px;
                padding-right: 8px;
                max-width: 480px;
                margin: 0 auto;
                position: relative;
            }
            #global-bottom-nav .bnav-pill {
                position: absolute;
                top: 6px;
                left: ${pillLeft};
                width: ${pillWidth};
                height: 3px;
                background: var(--accent-yellow);
                border-radius: 2px;
                transition: left 240ms cubic-bezier(0.22, 1, 0.36, 1);
                pointer-events: none;
            }
            #global-bottom-nav .bnav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                gap: 4px;
                flex: 1;
                height: 100%;
                text-decoration: none;
                color: var(--text-secondary);
                font-family: var(--font-primary);
                font-size: 12px;
                font-weight: 400;
                line-height: 1;
                -webkit-tap-highlight-color: transparent;
                min-width: 48px;
                padding: 4px 0;
                cursor: pointer;
                transition: color 180ms ease-out;
                touch-action: manipulation;
                user-select: none;
                -webkit-user-select: none;
                border: none;
                background: none;
            }
            #global-bottom-nav .bnav-item.active {
                color: var(--accent-yellow);
                font-weight: 500;
            }
            #global-bottom-nav .bnav-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
            }
            #global-bottom-nav .bnav-item span {
                font-size: 12px;
                line-height: 1.2;
                text-align: center;
            }
            @media (prefers-reduced-motion: reduce) {
                #global-bottom-nav .bnav-pill,
                #global-bottom-nav .bnav-item {
                    transition: none;
                }
            }
        </style>
        <div class="bnav-inner">
            <div class="bnav-pill" id="bnav-pill"></div>
            ${TABS.map((tab, i) => {
                const isActive = tab.id === activeTab;
                const color = isActive ? ACTIVE : INACTIVE;
                return `<button class="bnav-item${isActive ? ' active' : ''}"
                           data-tab="${tab.id}"
                           data-href="${tab.href}"
                           aria-label="${tab.label}"
                           ${isActive ? 'aria-current="page"' : ''}>
                    <div class="bnav-icon" data-icon="${tab.id}">${tab.iconFn(color)}</div>
                    <span>${tab.label}</span>
                </button>`;
            }).join('')}
        </div>
    `;

    const items = nav.querySelectorAll('.bnav-item');
    const motionAllowed = typeof window.matchMedia !== 'function'
        || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    items.forEach((item) => {
        const iconDiv = item.querySelector('.bnav-icon');

        item.addEventListener('pointerdown', () => {
            if (!motionAllowed) return;
            iconDiv?.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }],
                { duration: 70, easing: 'ease-out', fill: 'forwards' });
        });

        item.addEventListener('pointerup', () => {
            if (!motionAllowed) return;
            iconDiv?.animate([
                { transform: 'scale(0.9)' },
                { transform: 'scale(1.04)' },
                { transform: 'scale(1.0)' },
            ], { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
        });

        item.addEventListener('pointercancel', () => {
            iconDiv?.animate([{ transform: 'scale(1)' }], { duration: 150, fill: 'forwards' });
        });

        item.addEventListener('click', () => {
            const targetTab = item.dataset.tab;
            const targetHref = item.dataset.href;
            if (targetTab === nav.dataset.activeTab) return;
            navigate(targetHref);
        });
    });

    return nav;
}

function updateBottomNav(hash) {
    if (!_bottomNav) return;

    const tabId = hash === '#books' ? 'story' : (HASH_TO_TAB[hash] || null);

    if (TAB_BAR_ROUTES.has(hash)) {
        _bottomNav.style.display = '';

        if (tabId && tabId !== _bottomNav.dataset.activeTab) {
            const ACTIVE = '#fec348';
            const INACTIVE = '#9da3ad';
            const pill = _bottomNav.querySelector('#bnav-pill');
            const items = _bottomNav.querySelectorAll('.bnav-item');

            items.forEach((item, i) => {
                const isActive = item.dataset.tab === tabId;
                item.classList.toggle('active', isActive);
                if (isActive) {
                    item.setAttribute('aria-current', 'page');
                    const iw = item.querySelector('.bnav-icon');
                    if (iw) iw.innerHTML = TABS[i].iconFn(ACTIVE);
                    if (pill) pill.style.left = `${(i / TABS.length) * 100}%`;
                } else {
                    item.removeAttribute('aria-current');
                    const iw = item.querySelector('.bnav-icon');
                    if (iw) iw.innerHTML = TABS[i].iconFn(INACTIVE);
                }
            });

            _bottomNav.dataset.activeTab = tabId;
        }
    } else {
        _bottomNav.style.display = 'none';
    }
}

// ── Router state ──────────────────────────────────────────────────────────────
let _routerInitialized = false;
let _prevHash = null;
let _pendingHash = null;
let _routeCleanup = null;

function stopDomMediaPlayback() {
    document.querySelectorAll('audio,video').forEach((media) => {
        try {
            media.pause();
            media.removeAttribute('src');
            media.load?.();
        } catch {}
    });
}

function runRouteCleanup() {
    const cleanup = _routeCleanup;
    _routeCleanup = null;

    if (typeof cleanup === 'function') {
        try {
            cleanup();
        } catch (error) {
            console.error('[ROUTE] Cleanup error:', error);
        }
    }

    stopDomMediaPlayback();
}

// Callback set by initRouter() — called by the splash screen when it's done.
// This bypasses hashchange entirely, preventing spurious WebView hash restoration.
let _onSplashDone = null;

/**
 * Called by the splash screen (renderIntro) when it's ready to navigate away.
 * This is the ONLY way to leave the splash — never use navigate() from the splash.
 */
export function splashDone() {
    console.error('[SPLASH] splashDone() called at', Date.now());
    if (_onSplashDone) {
        _onSplashDone();
        _onSplashDone = null;
    } else {
        console.error('[SPLASH] _onSplashDone is null/undefined!');
    }
}

export function registerRouteCleanup(cleanup) {
    _routeCleanup = typeof cleanup === 'function' ? cleanup : null;
}

export function initRouter() {
    if (_routerInitialized) return;
    _routerInitialized = true;

    buildShell();

    // ALWAYS start with the splash screen (#intro) on every fresh app launch.
    // The Capacitor WebView on Android persists the URL hash across sessions.
    // We do NOT use history.replaceState here because some Android WebView versions
    // fire hashchange synchronously or asynchronously when replaceState changes the hash,
    // which would immediately navigate away from the splash.
    //
    // Instead: render the splash directly, then set up the hashchange listener.
    // The splash's navigate('#onboarding') call will set the hash and trigger hashchange.

    // Render the splash screen immediately.
    // The splash will call navigateFromSplash('#onboarding') when it's done.
    // Until then, ALL hashchange events are blocked — the Capacitor WebView on Android
    // fires spurious hashchange events restoring the persisted URL hash.
    let _splashDone = false;

    window.addEventListener('hashchange', () => {
        if (!_splashDone) {
            console.log('[ROUTE] Blocking hashchange during splash:', window.location.hash);
            return;
        }
        const hash = window.location.hash;
        console.log('[ROUTE]', _prevHash, '->', hash);
        handleRouteChange(hash);
    });

    // The onDone callback is passed directly to renderIntro() to avoid circular imports.
    // When the splash calls onDone(), it bypasses hashchange entirely.
    // Guard: only fire once — the splash timer and click handler both call this,
    // so we must ensure it only executes once.
    let _splashOnDoneFired = false;
    _onSplashDone = () => {
        if (_splashOnDoneFired) {
            console.log('[ONBOARDING] onDone called again — ignoring (already fired)');
            return;
        }
        _splashOnDoneFired = true;
        const destination = auth.isLoggedIn() ? '#home' : '#onboarding';
        console.log('[ONBOARDING] splash destination:', destination);
        _splashDone = true;
        // Reset _prevHash to null so handleRouteChange treats this as a first-load
        // and skips the hash-guard check. This is safe because we're explicitly
        // navigating to #onboarding — we don't need the guard here.
        _prevHash = null;
        // Update the URL hash so back-navigation works correctly.
        // We keep _splashDone=true so the hashchange listener won't double-render.
        try { window.history.replaceState(null, '', destination); } catch(e) {}
        handleRouteChange(destination);
    };

    // Render the splash directly — bypass the routes map to pass the onDone callback.
    // This avoids circular imports (onboarding.js doesn't need to import from router.js).
    const splashView = renderIntro(_onSplashDone);
    _prevHash = '#intro';
    updateBottomNav('#intro');
    _pageContent.style.overflowY = 'auto';
    _pageContent.style.paddingBottom = 'calc(110px + env(safe-area-inset-bottom,0px))';
    _pageContent.innerHTML = '';
    _pageContent.appendChild(splashView);
}

async function handleRouteChange(hash) {
    runRouteCleanup();

    // Resolve renderer — unknown/empty hash falls back to onboarding (never blank)
    const renderer = routes[hash] || routes['#onboarding'];
    if (!renderer) {
        console.error('[ROUTE] No renderer for', hash, '— falling back to onboarding');
        navigate('#onboarding');
        return;
    }

    const prevHash = _prevHash;
    const isFirstLoad = prevHash === null;

    _prevHash = hash;

    // Respond to the tap immediately while an async screen is rendering.
    updateBottomNav(hash);

    let view;
    try {
        view = await Promise.resolve(renderer());
    } catch (err) {
        console.error('[ROUTE] Renderer error for', hash, err);
        _pageContent.innerHTML = `<div style="
            min-height:100dvh;background:var(--bg-dark);color:var(--text-primary);
            padding:32px;font-family:sans-serif;
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
            <p style="color:#888;font-size:14px;">Something went wrong loading this screen.</p>
            <button onclick="window.location.hash='#home'" style="
                background:var(--accent-yellow);color:var(--bg-dark);border:none;border-radius:32px;
                padding:12px 24px;font-size:16px;cursor:pointer;">Go Home</button>
        </div>`;
        return;
    }

    // Guard: if hash changed while we were awaiting the renderer, abort
    if (window.location.hash !== hash && !isFirstLoad) {
        console.log('[ROUTE] Hash changed during render, aborting', hash);
        return;
    }

    if (!(view instanceof Element)) {
        console.error('[ROUTE] Renderer for', hash, 'did not return a DOM Element');
        navigate('#onboarding');
        return;
    }

    // Scroll/overflow settings
    if (NO_SCROLL_ROUTES.has(hash)) {
        _pageContent.style.overflowY = 'hidden';
        _pageContent.style.paddingBottom = '0px';
    } else {
        _pageContent.style.overflowY = 'auto';
        _pageContent.style.paddingBottom = 'calc(110px + env(safe-area-inset-bottom,0px))';
    }

    // Onboarding/intro screens use position:absolute;inset:0 internally — don't strip.
    // NO_SCROLL_ROUTES manage their own internal scroll — don't strip overflow either.
    const isFullscreenRoute = ['', '#intro', '#onboarding'].includes(hash);
    if (!isFullscreenRoute) {
        view.style.removeProperty('position');
        view.style.removeProperty('inset');
        if (!NO_SCROLL_ROUTES.has(hash)) {
            view.style.removeProperty('overflow-y');
            view.style.removeProperty('overflow-x');
            view.style.removeProperty('overflow');
            view.style.removeProperty('-webkit-overflow-scrolling');
        }
    }

    // ── Instant swap — no animation ───────────────────────────────────────────
    _pageContent.innerHTML = '';
    _pageContent.appendChild(view);
    if (!isFirstLoad) playTabTransition(view, prevHash, hash);

    // Process any pending navigation
    if (_pendingHash && _pendingHash !== hash) {
        const next = _pendingHash;
        _pendingHash = null;
        navigate(next);
    }
}

// ── Public navigation API ─────────────────────────────────────────────────────

/**
 * Navigate to a specific hash route.
 * This is the ONLY way to navigate — never use window.history.back() or
 * window.location.hash = directly from view code.
 */
export function navigate(hash) {
    if (!hash || !hash.startsWith('#')) {
        console.warn('[ROUTE] navigate() called with invalid hash:', hash, '— using #onboarding');
        hash = '#onboarding';
    }
    console.log('[ROUTE] navigate ->', hash);
    if (window.location.hash === hash) {
        // Hash is already set to this value — hashchange won't fire.
        // Call handleRouteChange directly to ensure the screen renders.
        handleRouteChange(hash);
    } else {
        window.location.hash = hash;
    }
}

/**
 * Go back to the explicit back-destination for the current route.
 * Falls back to fallback if no back-destination is defined.
 * NEVER calls window.history.back().
 */
export function goBack(fallback) {
    const current = window.location.hash || '';
    let dest = BACK_MAP[current];
    if (current === '#subscription') {
        try { dest = sessionStorage.getItem('kidsbible_subscription_return') || dest; } catch {}
    }
    const target = dest !== undefined ? dest : (fallback || '#onboarding');

    console.log('[BACK]', current, '->', target, fallback ? '(fallback: ' + fallback + ')' : '');

    if (target === null) {
        // null means "exit app" — handled by the caller (main.js)
        return null;
    }
    navigate(target);
    return target;
}

/**
 * Get the explicit back destination for a given hash.
 * Returns null if the screen should exit the app.
 * Returns '#onboarding' if the hash is unknown.
 */
export function getBackDest(hash) {
    let dest = BACK_MAP[hash || ''];
    if (hash === '#subscription') {
        try { dest = sessionStorage.getItem('kidsbible_subscription_return') || dest; } catch {}
    }
    return dest !== undefined ? dest : '#onboarding';
}

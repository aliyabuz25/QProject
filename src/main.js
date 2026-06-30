import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import './styles/main.css';
import { initRouter, navigate, getBackDest } from './js/router.js';
import { initializeBackgroundNotifications } from './services/backgroundNotifications.js';
import { dismissLegalWebView, hasOpenLegalWebView } from './services/legalWebView.js';

// Guard: only initialize once
let _initialized = false;

async function init() {
    if (_initialized) return;
    _initialized = true;

    // Configure status bar for edge-to-edge rendering
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            await StatusBar.show();
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.setBackgroundColor({ color: '#00000000' });
        } catch (e) {
            // ignore — may not be supported on all platforms
        }
    }

    initRouter();
    initializeBackgroundNotifications();

    // Android hardware back button — Capacitor native only
    // IMPORTANT: Never call window.history.back() — it can produce a blank screen.
    // Always use the explicit BACK_MAP via getBackDest().
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        App.addListener('backButton', () => {
            const hash = window.location.hash || '';
            console.log('[BACK] hardware back on', hash);

            if (hasOpenLegalWebView()) {
                console.log('[BACK] closing legal overlay');
                dismissLegalWebView();
                return;
            }

            const dest = getBackDest(hash);

            if (dest === null) {
                // null = exit app (home screen, onboarding root)
                console.log('[BACK] exiting app');
                App.exitApp();
                return;
            }

            console.log('[BACK]', hash, '->', dest);
            navigate(dest);
        });
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);

// Also handle case where DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
}

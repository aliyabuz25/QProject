import { navigate } from '../js/router.js';
import { Capacitor } from '@capacitor/core';
import { signInWithGoogleOAuth } from '../services/googleOAuthFlow.js';

/**
 * Onboarding flow — Figma "New" section
 *
 * Screen 1 — Splash (186:3884):
 *   Frame: 393×852, bg #000409
 *   Background image (imageRef ecc5c6652f9b04e0c38520a1d0e672961c2e8d40): x:0 y:0 w:393 h:852, scaleMode:FILL
 *   Logo (Unknown 2/3): x:17 y:71 w:50 h:50 (imageRef 2ee2246601bc73c5bbc2facd6962092aac48f532)
 *   NO text, NO buttons — pure splash screen
 *   Auto-transitions to Screen 2 after 1000ms
 *
 * Screen 2 — Auth (186:3892):
 *   Frame: 393×852, bg #000409
 *   Background image (imageRef e113a169ee55540c2ef472d6a0c2db832ef4f509): x:0 y:0 w:393 h:852, scaleMode:FILL
 *   Logo: x:16 y:75 w:50 h:50
 *   Content panel: y:447, padding:16px, gap:32px
 *     - Title: "Welcome to \nKids Bible Story" — Baloo 2 SemiBold 32px/48px #FFF center
 *     - Subtitle: "Choose a sign-in method below." — Baloo 2 Regular 18px/28px #DEE2E6 center
 *     - Buttons: Google, Apple (iOS only), Email
 */

const isAndroid = (() => {
    try { return Capacitor.getPlatform() === 'android'; } catch { return false; }
})();

// ─── Screen 1: Splash ─────────────────────────────────────────────────────────
// Figma node 186:3884
// Pure splash — full-screen background + logo, no text, no buttons.
// onDone: callback called when splash is ready to navigate away.
//         Passed by the router to avoid circular imports.
export function renderIntro(onDone) {
    const el = document.createElement('div');
    el.style.cssText = [
        'position:absolute;inset:0;',
        'background:#000409;',
        'overflow:hidden;',
        'cursor:pointer;',
    ].join('');
    el.setAttribute('data-screen', 'intro-splash');

    // Background image — full frame cover (imageRef ecc5c6652f9b04e0c38520a1d0e672961c2e8d40)
    const bg = document.createElement('img');
    bg.src = '/assets/images/onboarding/new-intro.png';
    bg.alt = '';
    bg.style.cssText = [
        'position:absolute;top:0;left:0;',
        'width:100%;height:100%;',
        'object-fit:cover;object-position:center center;',
        'display:block;pointer-events:none;',
    ].join('');
    el.appendChild(bg);

    // Logo — Figma: x:17 y:71 w:50 h:50
    // On Android: status bar is ~24-28dp. Figma y:71 is for iOS (59px status bar).
    // We use safe-area-inset-top + 12px to match the visual offset below the status bar.
    const logo = document.createElement('img');
    logo.src = '/assets/images/onboarding/intro-logo.png';
    logo.alt = 'Kids Bible Stories';
    logo.style.cssText = [
        'position:absolute;',
        'left:16px;',
        'top:calc(env(safe-area-inset-top,0px) + 75px);',
        'width:50px;height:50px;',
        'border-radius:138.89px;',
        'object-fit:cover;',
        'display:block;pointer-events:none;',
    ].join('');
    el.appendChild(logo);

    // Auto-transition after 1200ms. Timer starts when element is rendered.
    // Clicking also advances immediately.
    // Calls onDone() callback (provided by router) to bypass hashchange entirely —
    // prevents the Capacitor WebView from restoring the persisted hash.
    let _navigated = false;
    function goNext() {
        if (_navigated) return;
        _navigated = true;
        // Fade out the splash element
        el.style.transition = 'opacity 300ms ease-out';
        el.style.opacity = '0';
        setTimeout(() => {
            if (typeof onDone === 'function') {
                onDone();
            } else {
                navigate('#onboarding');
            }
        }, 320);
    }

    const timer = setTimeout(goNext, 1200);
    el.addEventListener('click', () => { clearTimeout(timer); goNext(); });

    return el;
}

// ─── Screen 2: Auth / Welcome ─────────────────────────────────────────────────
// Figma node 186:3892
// Shows welcome text + sign-in buttons.
export function renderOnboarding() {
    const el = document.createElement('div');
    el.style.cssText = [
        'position:absolute;inset:0;',
        'background:#000409;',
        'overflow:hidden;',
    ].join('');

    // ── Background image ──────────────────────────────────────────────────────
    // Figma: imageRef e113a169ee55540c2ef472d6a0c2db832ef4f509, x:0 y:0 w:393 h:852, FILL
    const bg = document.createElement('img');
    bg.src = '/assets/images/onboarding/new-login.png';
    bg.alt = '';
    bg.style.cssText = [
        'position:absolute;top:0;left:0;',
        'width:100%;height:100%;',
        'object-fit:cover;object-position:center center;',
        'display:block;pointer-events:none;',
    ].join('');
    el.appendChild(bg);

    // ── Logo ──────────────────────────────────────────────────────────────────
    // Figma: x:16 y:75 w:50 h:50
    // y:75 on 852px frame. Status bar is 59px. Logo is 16px below status bar.
    const logo = document.createElement('img');
    logo.src = '/assets/images/onboarding/intro-logo.png';
    logo.alt = 'Kids Bible Stories';
    logo.style.cssText = [
        'position:absolute;',
        'left:16px;',
        'top:calc(env(safe-area-inset-top,0px) + 75px);',
        'width:50px;height:50px;',
        'border-radius:138.89px;',
        'object-fit:cover;',
        'display:block;pointer-events:none;',
    ].join('');
    el.appendChild(logo);

    // ── Content panel ─────────────────────────────────────────────────────────
    // Figma: Frame 1984079028 (186:3896)
    //   x:0 y:447 w:393 on 852px frame
    //   padding:16px, gap:32px, column, alignItems:stretch
    //
    // y:447 / 852 = 52.5% from top. We anchor to bottom so it's always reachable.
    // On Android (no home indicator), add comfortable bottom padding.
    const panel = document.createElement('div');
    panel.style.cssText = [
        'position:absolute;',
        'left:0;right:0;',
        'bottom:0;',
        'padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 32px) 16px;',
        'display:flex;flex-direction:column;gap:32px;align-items:stretch;',
        'box-sizing:border-box;',
    ].join('');
    el.appendChild(panel);

    // ── Title group ───────────────────────────────────────────────────────────
    // Figma: Frame 1 (186:3897) — column, fill, no gap
    //   "Welcome to \nKids Bible Story" — Baloo 2 SemiBold 32px/48px #FFF center
    //   "Choose a sign-in method below." — Baloo 2 Regular 18px/28px #DEE2E6 center
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = 'display:flex;flex-direction:column;align-items:stretch;gap:0;';
    titleGroup.innerHTML = `
        <h1 style="
            font-family:'Baloo 2',sans-serif;
            font-weight:600;
            font-size:32px;
            line-height:48px;
            color:#FFFFFF;
            margin:0;padding:0;
            text-align:center;
            white-space:pre-line;
        ">Welcome to${'\n'}Kids Bible Story</h1>
        <p style="
            font-family:'Baloo 2',sans-serif;
            font-weight:400;
            font-size:18px;
            line-height:28px;
            color:#DEE2E6;
            margin:0;padding:0;
            text-align:center;
        ">Choose a sign-in method below.</p>`;
    panel.appendChild(titleGroup);

    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = [
        'display:none;',
        'background:rgba(255,68,68,0.12);',
        'border:1px solid rgba(255,68,68,0.4);',
        'border-radius:14px;',
        'padding:10px 14px;',
        "font-family:'Baloo 2',sans-serif;",
        'font-weight:400;',
        'font-size:15px;',
        'line-height:22px;',
        'color:#FF8A8A;',
        'text-align:center;',
    ].join('');
    panel.appendChild(errorMsg);

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }

    function hideError() {
        errorMsg.style.display = 'none';
    }

    // ── Buttons group ─────────────────────────────────────────────────────────
    // Figma: Frame 1984079027 (186:3900) — column, gap:8px, fill
    //   Google btn (186:3901): bg #1B1B1B, radius:32px, padding:16px 24px
    //   Apple btn (186:3905): same style — HIDDEN on Android
    //   Email btn (186:3909): same style
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:stretch;';
    panel.appendChild(btns);

    // Helper: create a sign-in button
    function makeBtn(iconSvg, label, onClick) {
        const btn = document.createElement('button');
        btn.style.cssText = [
            'width:100%;display:flex;flex-direction:row;',
            'justify-content:center;align-items:center;gap:14px;',
            'background:#1B1B1B;border:none;border-radius:32px;',
            'padding:16px 24px;cursor:pointer;',
            'box-sizing:border-box;',
            '-webkit-tap-highlight-color:transparent;',
            'transition:opacity 0.15s ease;',
        ].join('');
        btn.innerHTML = `
            ${iconSvg}
            <span style="
                font-family:'Baloo 2',sans-serif;
                font-weight:500;
                font-size:18px;
                line-height:28px;
                color:#FFFFFF;
                text-align:center;
            ">${label}</span>`;
        btn.addEventListener('click', onClick);
        return btn;
    }

    let _googleSubmitting = false;
    async function handleGoogleOAuth(button) {
        if (_googleSubmitting) return;
        _googleSubmitting = true;
        hideError();
        button.disabled = true;
        button.style.opacity = '0.6';
        button.querySelector('span').textContent = 'Signing in...';

        try {
            const result = await signInWithGoogleOAuth();
            if (result.ok) {
                navigate(result.isNewUser ? '#subscription' : '#home');
                return;
            }
            if (result.error !== 'cancelled') showError(result.error || 'Google Sign-In failed.');
        } finally {
            button.disabled = false;
            button.style.opacity = '1';
            button.querySelector('span').textContent = 'Continue with Google';
            _googleSubmitting = false;
        }
    }

    // Google button
    const googleIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink:0;">
        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35Z" fill="#4285F4"/>
        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20Z" fill="#34A853"/>
        <path d="M4.405 11.9A6.01 6.01 0 0 1 4.09 10c0-.663.114-1.308.314-1.9V5.51H1.064A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59Z" fill="#FBBC05"/>
        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 0 0 1.064 5.51l3.34 2.59C5.192 5.736 7.396 3.977 10 3.977Z" fill="#EA4335"/>
    </svg>`;
    btns.appendChild(makeBtn(googleIcon, 'Continue with Google', (event) => handleGoogleOAuth(event.currentTarget)));

    // Apple button — hidden on Android (product decision) and Web
    if (!isAndroid && Capacitor.isNativePlatform()) {
        const appleIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 3.99ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" fill="white"/>
        </svg>`;
        btns.appendChild(makeBtn(appleIcon, 'Continue with Apple', () => navigate('#subscription')));
    }

    // Email button
    const emailIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="m22 6-10 7L2 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btns.appendChild(makeBtn(emailIcon, 'Continue with Email', () => navigate('#signup')));

    return el;
}

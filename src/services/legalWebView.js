export function openTermsAndConditions() {
    openBrowserFallback('/legal/terms-and-conditions.html', 'Terms & Conditions');
}

export function openPrivacyPolicy() {
    openBrowserFallback('/legal/privacy-policy.html', 'Privacy Policy');
}

export function hasOpenLegalWebView() {
    return Boolean(document.getElementById('legal-webview-overlay'));
}

export function dismissLegalWebView() {
    const overlay = document.getElementById('legal-webview-overlay');
    if (!overlay) return false;

    if (typeof overlay.__dismiss === 'function') {
        overlay.__dismiss();
        return true;
    }

    overlay.remove();
    return true;
}

function openBrowserFallback(url, title = 'Terms & Conditions') {
    if (document.getElementById('legal-webview-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'legal-webview-overlay';
    overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:99999',
        'background:#0D0D0D',
        'display:flex',
        'flex-direction:column',
        'transform:translateY(100%)',
        'transition:transform 280ms cubic-bezier(.2,.8,.2,1)',
    ].join(';');

    // Header: accounts for status bar safe area so buttons are never hidden
    const header = document.createElement('div');
    header.style.cssText = [
        'flex-shrink:0',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'position:relative',
        'color:#fff',
        'font:600 18px "Baloo 2",sans-serif',
        // Push content below the status bar
        'padding-top:env(safe-area-inset-top, 20px)',
        'padding-bottom:0',
        'min-height:calc(56px + env(safe-area-inset-top, 20px))',
        'box-sizing:border-box',
        'background:#161616',
        'border-bottom:1px solid #252525',
    ].join(';');
    header.innerHTML = `<span style="padding:16px 64px 16px 64px;text-align:center;">${title}</span>`;

    // Back/close button — left side, large tap target
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', `Close ${title}`);
    close.style.cssText = [
        'position:absolute',
        'left:0',
        'bottom:0',
        'width:64px',
        'height:56px',
        'border:0',
        'background:transparent',
        'color:#fff',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'cursor:pointer',
        'padding:0',
        '-webkit-tap-highlight-color:transparent',
    ].join(';');
    // Use a back-arrow SVG for clarity
    close.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    header.appendChild(close);

    const frame = document.createElement('iframe');
    frame.title = title;
    frame.src = url;
    frame.style.cssText = 'width:100%;flex:1;border:0;background:#0D0D0D;';

    let isDismissing = false;
    const dismiss = () => {
        if (isDismissing) return;
        isDismissing = true;
        overlay.style.transform = 'translateY(100%)';
        setTimeout(() => overlay.remove(), 280);
    };
    overlay.__dismiss = dismiss;

    close.addEventListener('click', dismiss);
    close.addEventListener('touchend', (e) => { e.preventDefault(); dismiss(); });

    // Swipe down to dismiss
    let touchStartY = 0;
    overlay.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    overlay.addEventListener('touchend', (e) => {
        const delta = e.changedTouches[0].clientY - touchStartY;
        if (delta > 80) dismiss();
    }, { passive: true });

    overlay.append(header, frame);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.style.transform = 'translateY(0)';
    });
}

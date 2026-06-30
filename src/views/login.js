import { navigate } from '../js/router.js';
import { auth } from '../services/api.js';
import { signInWithGoogleOAuth } from '../services/googleOAuthFlow.js';

/**
 * Login screen
 * Collects: email, password
 * Also supports "Continue with Google" via native Google Sign-In plugin.
 */
export function renderLogin() {
    if (!document.getElementById('login-styles')) {
        const style = document.createElement('style');
        style.id = 'login-styles';
        style.textContent = `
            .li-input::placeholder { color:#74797F;font-family:'Fredoka',sans-serif;font-weight:400;font-size:14px; }
            .li-input:focus { outline:none; }
            .li-btn-continue { transition:opacity 0.15s ease; }
            .li-btn-continue:active { opacity:0.75 !important; }
            .li-back-btn:active { opacity:0.7; }
            .li-signup-link:active { opacity:0.7; }
            .li-input-wrap { transition:border-color 0.15s ease; }
        `;
        document.head.appendChild(style);
    }

    const el = document.createElement('div');
    el.style.cssText = [
        'min-height:100dvh;background:#0D0D0D;display:flex;flex-direction:column;',
        'box-sizing:border-box;margin-bottom:-110px;',
        'padding-bottom:calc(env(safe-area-inset-bottom,0px) + 32px);',
    ].join('');

    // ── Back button ───────────────────────────────────────────────────────────
    const backRow = document.createElement('div');
    backRow.style.cssText = 'padding:calc(env(safe-area-inset-top,0px) + 8px) 16px 0 16px;flex-shrink:0;';
    const btnBack = document.createElement('button');
    btnBack.className = 'li-back-btn';
    btnBack.setAttribute('aria-label', 'Go back');
    btnBack.style.cssText = [
        'width:44px;height:44px;border-radius:100px;border:none;cursor:pointer;',
        'background:rgba(66,66,66,0.69);display:flex;align-items:center;justify-content:center;',
        'box-sizing:border-box;-webkit-tap-highlight-color:transparent;flex-shrink:0;padding:0;',
    ].join('');
    btnBack.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M15 19.5L7.5 12L15 4.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btnBack.addEventListener('click', () => navigate('#onboarding'));
    backRow.appendChild(btnBack);
    el.appendChild(backRow);

    // ── Main content ──────────────────────────────────────────────────────────
    const content = document.createElement('div');
    content.style.cssText = [
        'flex:1;display:flex;flex-direction:column;justify-content:space-between;',
        'padding:56px 16px 0 16px;box-sizing:border-box;min-height:0;',
    ].join('');
    el.appendChild(content);

    // ── Top section ───────────────────────────────────────────────────────────
    const topSection = document.createElement('div');
    topSection.style.cssText = 'display:flex;flex-direction:column;gap:50px;';
    content.appendChild(topSection);

    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    titleGroup.innerHTML = `
        <h1 style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:32px;line-height:48px;
            color:#E9ECEF;margin:0;padding:0;text-align:center;">Log in to your account</h1>
        <p style="font-family:'Fredoka',sans-serif;font-weight:400;font-size:16px;line-height:24px;
            color:#7B7B7B;margin:0;padding:0;text-align:center;">Use your email to access your account.</p>`;
    topSection.appendChild(titleGroup);

    const formGroup = document.createElement('div');
    formGroup.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
    topSection.appendChild(formGroup);

    // ── Email field ───────────────────────────────────────────────────────────
    const emailGroup = document.createElement('div');
    emailGroup.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const emailLabel = document.createElement('label');
    emailLabel.htmlFor = 'li-email';
    emailLabel.style.cssText = "font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;color:#FFFFFF;display:block;";
    emailLabel.textContent = 'Email Address';
    emailGroup.appendChild(emailLabel);

    const emailWrap = document.createElement('div');
    emailWrap.className = 'li-input-wrap';
    emailWrap.style.cssText = [
        'display:flex;flex-direction:row;align-items:center;',
        'border:1px solid #2C2D2E;border-radius:32px;',
        'padding:0 18px;height:56px;box-sizing:border-box;background:transparent;',
    ].join('');

    const emailInput = document.createElement('input');
    emailInput.id = 'li-email';
    emailInput.type = 'email';
    emailInput.inputMode = 'email';
    emailInput.placeholder = 'john@example.com';
    emailInput.autocomplete = 'email';
    emailInput.autocapitalize = 'none';
    emailInput.autocorrect = 'off';
    emailInput.spellcheck = false;
    emailInput.className = 'li-input';
    emailInput.style.cssText = [
        'flex:1;background:transparent;border:none;outline:none;',
        "font-family:'Fredoka',sans-serif;font-weight:400;font-size:14px;line-height:24px;",
        'color:#FFFFFF;caret-color:#FEC348;width:100%;min-width:0;',
        '-webkit-appearance:none;appearance:none;',
    ].join('');
    emailInput.addEventListener('focus', () => { emailWrap.style.borderColor = '#FEC348'; });
    emailInput.addEventListener('blur', () => { if (!emailInput.value.trim()) emailWrap.style.borderColor = '#2C2D2E'; });
    emailInput.addEventListener('input', () => { emailWrap.style.borderColor = emailInput.value.trim() ? '#FEC348' : '#2C2D2E'; checkFormValid(); });
    emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') passwordInput.focus(); });
    emailWrap.appendChild(emailInput);
    emailGroup.appendChild(emailWrap);
    formGroup.appendChild(emailGroup);

    // ── Password field ────────────────────────────────────────────────────────
    const passwordGroup = document.createElement('div');
    passwordGroup.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const passwordLabel = document.createElement('label');
    passwordLabel.htmlFor = 'li-password';
    passwordLabel.style.cssText = "font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;color:#FFFFFF;display:block;";
    passwordLabel.textContent = 'Password';
    passwordGroup.appendChild(passwordLabel);

    const passwordWrap = document.createElement('div');
    passwordWrap.className = 'li-input-wrap';
    passwordWrap.style.cssText = [
        'display:flex;flex-direction:row;align-items:center;',
        'border:1px solid #2C2D2E;border-radius:32px;',
        'padding:0 18px;height:56px;box-sizing:border-box;background:transparent;',
    ].join('');

    const passwordInput = document.createElement('input');
    passwordInput.id = 'li-password';
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Your password';
    passwordInput.autocomplete = 'current-password';
    passwordInput.autocapitalize = 'none';
    passwordInput.autocorrect = 'off';
    passwordInput.spellcheck = false;
    passwordInput.className = 'li-input';
    passwordInput.style.cssText = [
        'flex:1;background:transparent;border:none;outline:none;',
        "font-family:'Fredoka',sans-serif;font-weight:400;font-size:14px;line-height:24px;",
        'color:#FFFFFF;caret-color:#FEC348;width:100%;min-width:0;',
        '-webkit-appearance:none;appearance:none;',
    ].join('');

    const pwToggle = document.createElement('button');
    pwToggle.type = 'button';
    pwToggle.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;flex-shrink:0;-webkit-tap-highlight-color:transparent;';
    let pwVisible = false;
    function eyeIcon(v) {
        if (v) return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke="#9da3ad" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="#9da3ad" stroke-width="1.5"/></svg>`;
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#9da3ad" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#9da3ad" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    }
    pwToggle.innerHTML = eyeIcon(false);
    pwToggle.addEventListener('click', () => { pwVisible = !pwVisible; passwordInput.type = pwVisible ? 'text' : 'password'; pwToggle.innerHTML = eyeIcon(pwVisible); });

    passwordInput.addEventListener('focus', () => { passwordWrap.style.borderColor = '#FEC348'; });
    passwordInput.addEventListener('blur', () => { if (!passwordInput.value.trim()) passwordWrap.style.borderColor = '#2C2D2E'; });
    passwordInput.addEventListener('input', () => { passwordWrap.style.borderColor = passwordInput.value.trim() ? '#FEC348' : '#2C2D2E'; checkFormValid(); });
    passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });

    passwordWrap.appendChild(passwordInput);
    passwordWrap.appendChild(pwToggle);
    passwordGroup.appendChild(passwordWrap);
    formGroup.appendChild(passwordGroup);

    // ── Error message ─────────────────────────────────────────────────────────
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = [
        'display:none;background:rgba(255,68,68,0.12);border:1px solid rgba(255,68,68,0.4);',
        "border-radius:12px;padding:10px 14px;font-family:'Fredoka',sans-serif;",
        'font-size:14px;line-height:20px;color:#FF6B6B;text-align:center;',
    ].join('');
    topSection.appendChild(errorMsg);

    function showError(msg) { errorMsg.textContent = msg; errorMsg.style.display = 'block'; }
    function hideError() { errorMsg.style.display = 'none'; }

    // ── Bottom section ────────────────────────────────────────────────────────
    const bottomSection = document.createElement('div');
    bottomSection.style.cssText = 'display:flex;flex-direction:column;align-items:stretch;gap:16px;padding-bottom:8px;';
    content.appendChild(bottomSection);

    // Log In button
    const btnContinue = document.createElement('button');
    btnContinue.className = 'li-btn-continue';
    btnContinue.style.cssText = [
        'width:100%;display:flex;align-items:center;justify-content:center;',
        'background:#FEC348;border:none;border-radius:32px;',
        'padding:12px 16px;height:48px;cursor:pointer;box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;opacity:0.45;transition:opacity 0.15s ease;',
    ].join('');
    btnContinue.innerHTML = `<span style="font-family:'Poppins',sans-serif;font-weight:500;font-size:16px;line-height:20px;color:#0D0D0D;pointer-events:none;">Log In</span>`;

    function checkFormValid() {
        const ok = emailInput.value.trim() && passwordInput.value.trim();
        btnContinue.style.opacity = ok ? '1' : '0.45';
        return !!ok;
    }

    let _submitting = false;
    async function handleSubmit() {
        if (_submitting) return;
        hideError();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email) { emailWrap.style.borderColor = '#FF4444'; emailInput.focus(); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { emailWrap.style.borderColor = '#FF4444'; showError('Please enter a valid email address.'); emailInput.focus(); return; }
        if (!password) { passwordWrap.style.borderColor = '#FF4444'; passwordInput.focus(); return; }

        _submitting = true;
        btnContinue.style.opacity = '0.6';
        btnContinue.querySelector('span').textContent = 'Logging in...';
        btnContinue.disabled = true;

        const result = await auth.login({ email, password });

        _submitting = false;
        btnContinue.disabled = false;
        btnContinue.querySelector('span').textContent = 'Log In';
        checkFormValid();

        if (result.ok) {
            navigate('#home');
        } else {
            showError(result.error || 'Login failed. Please try again.');
        }
    }

    btnContinue.addEventListener('click', handleSubmit);
    bottomSection.appendChild(btnContinue);

    // OR divider
    const orRow = document.createElement('div');
    orRow.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:12px;';
    orRow.innerHTML = `
        <div style="flex:1;height:1px;background:#2C2D2E;"></div>
        <span style="font-family:'Poppins',sans-serif;font-weight:400;font-size:13px;color:#555;flex-shrink:0;">or</span>
        <div style="flex:1;height:1px;background:#2C2D2E;"></div>`;
    bottomSection.appendChild(orRow);

    // Continue with Google button
    const btnGoogle = document.createElement('button');
    btnGoogle.style.cssText = [
        'width:100%;display:flex;align-items:center;justify-content:center;gap:10px;',
        'background:#1A1A1A;border:1px solid #2C2D2E;border-radius:32px;',
        'padding:12px 16px;height:48px;cursor:pointer;box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;transition:opacity 0.15s ease;',
    ].join('');
    btnGoogle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
        </svg>
        <span style="font-family:'Poppins',sans-serif;font-weight:500;font-size:15px;line-height:20px;color:#FFFFFF;pointer-events:none;">Continue with Google</span>`;

    let _googleSubmitting = false;
    btnGoogle.addEventListener('click', async () => {
        if (_googleSubmitting) return;
        _googleSubmitting = true;
        hideError();
        btnGoogle.style.opacity = '0.6';
        btnGoogle.disabled = true;
        btnGoogle.querySelector('span').textContent = 'Signing in...';

        try {
            const result = await signInWithGoogleOAuth();
            if (result.ok) {
                navigate(result.isNewUser ? '#subscription' : '#home');
                return;
            }
            if (result.error !== 'cancelled') showError(result.error || 'Google Sign-In failed.');
        } finally {
            btnGoogle.style.opacity = '1';
            btnGoogle.disabled = false;
            btnGoogle.querySelector('span').textContent = 'Continue with Google';
            _googleSubmitting = false;
        }
    });
    bottomSection.appendChild(btnGoogle);

    // Sign Up link
    const linkRow = document.createElement('div');
    linkRow.style.cssText = 'display:flex;flex-direction:row;justify-content:center;align-items:center;gap:7px;height:20px;';
    linkRow.innerHTML = `
        <span style="font-family:'Poppins',sans-serif;font-weight:400;font-size:14px;line-height:20px;color:#90979D;">Don't have an account?</span>
        <span class="li-signup-link" style="font-family:'Poppins',sans-serif;font-weight:500;font-size:14px;
            line-height:20px;color:#FEC348;cursor:pointer;-webkit-tap-highlight-color:transparent;">Sign Up</span>`;
    bottomSection.appendChild(linkRow);
    linkRow.querySelector('.li-signup-link').addEventListener('click', () => navigate('#signup'));

    return el;
}

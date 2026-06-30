import { navigate } from '../js/router.js';
import { auth } from '../services/api.js';
import { googleSignIn } from '../services/googleAuth.js';

/**
 * Sign up / Create account — Figma 155:3206 style
 *
 * Collects all backend-required fields:
 *   firstName, lastName, email, phoneNumber, password
 *
 * On submit: calls POST /api/register
 * On success: stores JWT, navigates to #subscription
 * On error: shows clean error message
 */
export function renderSignup() {
    // Inject styles once
    if (!document.getElementById('signup-styles')) {
        const style = document.createElement('style');
        style.id = 'signup-styles';
        style.textContent = `
            .su-input::placeholder {
                color: #74797F;
                font-family: 'Fredoka', sans-serif;
                font-weight: 400;
                font-size: 14px;
            }
            .su-input:focus { outline: none; }
            .su-btn-continue { transition: opacity 0.15s ease; }
            .su-btn-continue:active { opacity: 0.75 !important; }
            .su-back-btn:active { opacity: 0.7; }
            .su-login-link:active { opacity: 0.7; }
            .su-input-wrap { transition: border-color 0.15s ease; }
        `;
        document.head.appendChild(style);
    }

    const el = document.createElement('div');
    el.style.cssText = [
        'min-height:100dvh;',
        'background:#0D0D0D;',
        'display:flex;',
        'flex-direction:column;',
        'box-sizing:border-box;',
        'margin-bottom:-110px;',
        'padding-bottom:calc(env(safe-area-inset-bottom,0px) + 32px);',
    ].join('');

    // ── Back button ───────────────────────────────────────────────────────────
    const backRow = document.createElement('div');
    backRow.style.cssText = 'padding:calc(env(safe-area-inset-top,0px) + 8px) 16px 0 16px;flex-shrink:0;';

    const btnBack = document.createElement('button');
    btnBack.className = 'su-back-btn';
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
        'padding:40px 16px 0 16px;box-sizing:border-box;min-height:0;',
    ].join('');
    el.appendChild(content);

    // ── Top section ───────────────────────────────────────────────────────────
    const topSection = document.createElement('div');
    topSection.style.cssText = 'display:flex;flex-direction:column;gap:32px;';
    content.appendChild(topSection);

    // Title group
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    titleGroup.innerHTML = `
        <h1 style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:32px;line-height:48px;
            color:#E9ECEF;margin:0;padding:0;text-align:center;">Create your account</h1>
        <p style="font-family:'Fredoka',sans-serif;font-weight:400;font-size:16px;line-height:24px;
            color:#7B7B7B;margin:0;padding:0;text-align:center;">Fill in your details to get started.</p>`;
    topSection.appendChild(titleGroup);

    // Form group
    const formGroup = document.createElement('div');
    formGroup.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
    topSection.appendChild(formGroup);

    // Helper: create a labeled input field
    function makeField(id, labelText, type, placeholder, inputMode, autocomplete) {
        const group = document.createElement('div');
        group.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

        const label = document.createElement('label');
        label.htmlFor = id;
        label.style.cssText = "font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;color:#FFFFFF;display:block;";
        label.textContent = labelText;
        group.appendChild(label);

        const wrap = document.createElement('div');
        wrap.className = 'su-input-wrap';
        wrap.style.cssText = [
            'display:flex;flex-direction:row;align-items:center;',
            'border:1px solid #2C2D2E;border-radius:32px;',
            'padding:0 18px;height:56px;box-sizing:border-box;background:transparent;',
        ].join('');

        const input = document.createElement('input');
        input.id = id;
        input.type = type;
        if (inputMode) input.inputMode = inputMode;
        input.placeholder = placeholder;
        if (autocomplete) input.autocomplete = autocomplete;
        input.autocapitalize = (type === 'email' || id === 'su-phone') ? 'none' : 'words';
        input.autocorrect = 'off';
        input.spellcheck = false;
        input.className = 'su-input';
        input.style.cssText = [
            'flex:1;background:transparent;border:none;outline:none;',
            "font-family:'Fredoka',sans-serif;font-weight:400;font-size:14px;line-height:24px;",
            'color:#FFFFFF;caret-color:#FEC348;width:100%;min-width:0;',
            '-webkit-appearance:none;appearance:none;',
        ].join('');

        input.addEventListener('focus', () => { wrap.style.borderColor = '#FEC348'; });
        input.addEventListener('blur', () => {
            if (!input.value.trim()) wrap.style.borderColor = '#2C2D2E';
        });
        input.addEventListener('input', () => {
            wrap.style.borderColor = input.value.trim() ? '#FEC348' : '#2C2D2E';
            checkFormValid();
        });

        wrap.appendChild(input);
        group.appendChild(wrap);
        return { group, input, wrap };
    }

    // Password field with show/hide toggle
    function makePasswordField(id, labelText) {
        const group = document.createElement('div');
        group.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

        const label = document.createElement('label');
        label.htmlFor = id;
        label.style.cssText = "font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;color:#FFFFFF;display:block;";
        label.textContent = labelText;
        group.appendChild(label);

        const wrap = document.createElement('div');
        wrap.className = 'su-input-wrap';
        wrap.style.cssText = [
            'display:flex;flex-direction:row;align-items:center;',
            'border:1px solid #2C2D2E;border-radius:32px;',
            'padding:0 18px;height:56px;box-sizing:border-box;background:transparent;',
        ].join('');

        const input = document.createElement('input');
        input.id = id;
        input.type = 'password';
        input.placeholder = 'Min. 8 characters';
        input.autocomplete = 'new-password';
        input.autocapitalize = 'none';
        input.autocorrect = 'off';
        input.spellcheck = false;
        input.className = 'su-input';
        input.style.cssText = [
            'flex:1;background:transparent;border:none;outline:none;',
            "font-family:'Fredoka',sans-serif;font-weight:400;font-size:14px;line-height:24px;",
            'color:#FFFFFF;caret-color:#FEC348;width:100%;min-width:0;',
            '-webkit-appearance:none;appearance:none;',
        ].join('');

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;flex-shrink:0;-webkit-tap-highlight-color:transparent;';
        toggle.innerHTML = eyeIcon(false);
        let visible = false;
        toggle.addEventListener('click', () => {
            visible = !visible;
            input.type = visible ? 'text' : 'password';
            toggle.innerHTML = eyeIcon(visible);
        });

        input.addEventListener('focus', () => { wrap.style.borderColor = '#FEC348'; });
        input.addEventListener('blur', () => {
            if (!input.value.trim()) wrap.style.borderColor = '#2C2D2E';
        });
        input.addEventListener('input', () => {
            wrap.style.borderColor = input.value.trim() ? '#FEC348' : '#2C2D2E';
            checkFormValid();
        });

        wrap.appendChild(input);
        wrap.appendChild(toggle);
        group.appendChild(wrap);
        return { group, input, wrap };
    }

    function eyeIcon(visible) {
        if (visible) {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke="#9da3ad" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="3" stroke="#9da3ad" stroke-width="1.5"/>
            </svg>`;
        }
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#9da3ad" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="#9da3ad" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
    }

    // Create all fields
    const { group: firstNameGroup, input: firstNameInput, wrap: firstNameWrap } =
        makeField('su-firstname', 'First Name', 'text', 'John', 'text', 'given-name');
    const { group: lastNameGroup, input: lastNameInput, wrap: lastNameWrap } =
        makeField('su-lastname', 'Last Name', 'text', 'Doe', 'text', 'family-name');
    const { group: emailGroup, input: emailInput, wrap: emailWrap } =
        makeField('su-email', 'Email Address', 'email', 'john@example.com', 'email', 'email');
    const { group: phoneGroup, input: phoneInput, wrap: phoneWrap } =
        makeField('su-phone', 'Phone Number', 'tel', '+1 234 567 8900', 'tel', 'tel');
    const { group: passwordGroup, input: passwordInput, wrap: passwordWrap } =
        makePasswordField('su-password', 'Password');

    formGroup.appendChild(firstNameGroup);
    formGroup.appendChild(lastNameGroup);
    formGroup.appendChild(emailGroup);
    formGroup.appendChild(phoneGroup);
    formGroup.appendChild(passwordGroup);

    // ── Error message ─────────────────────────────────────────────────────────
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = [
        'display:none;',
        'background:rgba(255,68,68,0.12);',
        'border:1px solid rgba(255,68,68,0.4);',
        'border-radius:12px;',
        'padding:10px 14px;',
        "font-family:'Fredoka',sans-serif;",
        'font-size:14px;',
        'line-height:20px;',
        'color:#FF6B6B;',
        'text-align:center;',
    ].join('');
    topSection.appendChild(errorMsg);

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
    function hideError() {
        errorMsg.style.display = 'none';
    }

    // ── Bottom section ────────────────────────────────────────────────────────
    const bottomSection = document.createElement('div');
    bottomSection.style.cssText = 'display:flex;flex-direction:column;align-items:stretch;gap:16px;padding:24px 0 8px 0;';
    content.appendChild(bottomSection);

    // Create Account button
    const btnContinue = document.createElement('button');
    btnContinue.className = 'su-btn-continue';
    btnContinue.style.cssText = [
        'width:100%;display:flex;align-items:center;justify-content:center;',
        'background:#FEC348;border:none;border-radius:32px;',
        'padding:12px 16px;height:48px;cursor:pointer;box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;opacity:0.45;transition:opacity 0.15s ease;',
    ].join('');
    btnContinue.innerHTML = `<span style="font-family:'Poppins',sans-serif;font-weight:500;font-size:16px;
        line-height:20px;color:#0D0D0D;pointer-events:none;">Create Account</span>`;

    function checkFormValid() {
        const ok = firstNameInput.value.trim()
            && lastNameInput.value.trim()
            && emailInput.value.trim()
            && phoneInput.value.trim()
            && passwordInput.value.trim();
        btnContinue.style.opacity = ok ? '1' : '0.45';
        return !!ok;
    }

    // Allow Enter key to submit from any field
    [firstNameInput, lastNameInput, emailInput, phoneInput, passwordInput].forEach(inp => {
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });
    });

    let _submitting = false;
    async function handleSubmit() {
        if (_submitting) return;
        hideError();

        const firstName = firstNameInput.value.trim();
        const lastName  = lastNameInput.value.trim();
        const email     = emailInput.value.trim();
        const phone     = phoneInput.value.trim();
        const password  = passwordInput.value.trim();

        // Validate
        if (!firstName) { firstNameWrap.style.borderColor = '#FF4444'; firstNameInput.focus(); return; }
        if (!lastName)  { lastNameWrap.style.borderColor  = '#FF4444'; lastNameInput.focus();  return; }
        if (!email)     { emailWrap.style.borderColor     = '#FF4444'; emailInput.focus();     return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailWrap.style.borderColor = '#FF4444';
            showError('Please enter a valid email address.');
            emailInput.focus();
            return;
        }
        if (!phone) { phoneWrap.style.borderColor = '#FF4444'; phoneInput.focus(); return; }
        if (!password) { passwordWrap.style.borderColor = '#FF4444'; passwordInput.focus(); return; }
        if (password.length < 6) {
            passwordWrap.style.borderColor = '#FF4444';
            showError('Password must be at least 6 characters.');
            passwordInput.focus();
            return;
        }

        // Loading state
        _submitting = true;
        btnContinue.style.opacity = '0.6';
        btnContinue.querySelector('span').textContent = 'Creating account...';
        btnContinue.disabled = true;

        console.log('[SIGNUP] Registering:', email);
        const result = await auth.register({
            firstName,
            lastName,
            email,
            phoneNumber: phone,
            password,
        });

        _submitting = false;
        btnContinue.disabled = false;
        btnContinue.querySelector('span').textContent = 'Create Account';
        checkFormValid();

        if (result.ok) {
            console.log('[SIGNUP] Success, token:', result.token ? 'received' : 'none');
            navigate('#subscription');
        } else {
            console.error('[SIGNUP] Error:', result.error);
            showError(result.error || 'Registration failed. Please try again.');
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
    btnGoogle.type = 'button';
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
            const result = await googleSignIn();
            if (result.ok) {
                try {
                    const user = {
                        email:     result.email,
                        firstName: result.givenName,
                        lastName:  result.familyName,
                        name:      result.displayName,
                        photoUrl:  result.photoUrl,
                        googleId:  result.id,
                    };
                    localStorage.setItem('kidsbible_user', JSON.stringify(user));
                    if (result.idToken) localStorage.setItem('kidsbible_access_token', result.idToken);
                } catch {}
                navigate('#home');
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

    // "Have an account? Log In" link
    const linkRow = document.createElement('div');
    linkRow.style.cssText = 'display:flex;flex-direction:row;justify-content:center;align-items:center;gap:7px;height:20px;';
    linkRow.innerHTML = `
        <span style="font-family:'Poppins',sans-serif;font-weight:400;font-size:14px;line-height:20px;color:#90979D;">Have an account?</span>
        <span class="su-login-link" style="font-family:'Poppins',sans-serif;font-weight:500;font-size:14px;
            line-height:20px;color:#FEC348;cursor:pointer;-webkit-tap-highlight-color:transparent;">Log In</span>`;
    bottomSection.appendChild(linkRow);
    linkRow.querySelector('.su-login-link').addEventListener('click', () => navigate('#login'));

    return el;
}

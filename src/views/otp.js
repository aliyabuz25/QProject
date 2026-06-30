import { navigate } from '../js/router.js';

/**
 * OTP Code — Figma 155:3259
 *
 * Dark bg #0D0D0D, no fake iOS status bar, no fake keyboard.
 * Back button top-left (flows with page, not fixed).
 * Title: "Verify your Email" — Fredoka SemiBold 32px/48px #E9ECEF center
 * Subtitle: Fredoka Regular 16px/24px, grey + white email
 * 4 OTP boxes: 60×60, border #2C2D2E 1px, radius 12px
 *   focused: border #FEC348
 *   filled: border #FEC348, text #FFFFFF Fredoka SemiBold 24px
 *   error: border #FF4444
 * Resend row: "You can resend the code in" #FFFFFF + " 01:00" #FEC348
 * Continue: bg #FEC348, radius 32px, h:48px, Poppins Medium 16px #0D0D0D
 * Mock valid OTP: 1111
 */
export function renderOtp() {
    const email = sessionStorage.getItem('signup_email') || 'your email';
    const MOCK_OTP = '1111';

    // Inject styles once
    if (!document.getElementById('otp-styles')) {
        const style = document.createElement('style');
        style.id = 'otp-styles';
        style.textContent = `
            .otp-digit-input {
                width: 60px;
                height: 60px;
                border: 1px solid #2C2D2E;
                border-radius: 12px;
                background: transparent;
                color: #FFFFFF;
                font-family: 'Fredoka', sans-serif;
                font-weight: 600;
                font-size: 24px;
                text-align: center;
                caret-color: #FEC348;
                outline: none;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
                transition: border-color 0.15s ease;
                /* Remove number input spinners */
                -moz-appearance: textfield;
            }
            .otp-digit-input::-webkit-outer-spin-button,
            .otp-digit-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .otp-digit-input:focus {
                border-color: #FEC348;
                outline: none;
            }
            .otp-digit-input.filled {
                border-color: #FEC348;
            }
            .otp-digit-input.error {
                border-color: #FF4444;
            }
            .otp-back-btn:active {
                opacity: 0.7;
            }
            .otp-btn-continue {
                transition: opacity 0.15s ease;
            }
            .otp-btn-continue:active {
                opacity: 0.85;
            }
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
        'padding:calc(env(safe-area-inset-top,0px) + 8px) 0 calc(env(safe-area-inset-bottom,0px) + 32px) 0;',
    ].join('');

    // ── Back button row ───────────────────────────────────────────────────────
    const backRow = document.createElement('div');
    backRow.style.cssText = 'padding:8px 16px 0 16px;flex-shrink:0;';

    const btnBack = document.createElement('button');
    btnBack.className = 'otp-back-btn';
    btnBack.style.cssText = [
        'width:44px;height:44px;',
        'border-radius:100px;border:none;cursor:pointer;',
        'background:rgba(66,66,66,0.69);',
        'display:flex;align-items:center;justify-content:center;',
        'box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;',
        'flex-shrink:0;',
    ].join('');
    btnBack.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 19l-7-7 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btnBack.addEventListener('click', () => {
        clearInterval(timerInterval);
        navigate('#signup');
    });
    backRow.appendChild(btnBack);
    el.appendChild(backRow);

    // ── Main content ──────────────────────────────────────────────────────────
    const content = document.createElement('div');
    content.style.cssText = [
        'flex:1;',
        'display:flex;',
        'flex-direction:column;',
        'justify-content:space-between;',
        'padding:48px 16px 0 16px;',
        'box-sizing:border-box;',
        'gap:32px;',
    ].join('');
    el.appendChild(content);

    // ── Top section ───────────────────────────────────────────────────────────
    const topSection = document.createElement('div');
    topSection.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:56px;';
    content.appendChild(topSection);

    // Title group (gap:4px)
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = 'display:flex;flex-direction:column;gap:4px;width:100%;';
    titleGroup.innerHTML = `
        <h1 style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:32px;line-height:48px;color:#E9ECEF;margin:0;padding:0;text-align:center;">Verify your Email</h1>
        <p style="font-family:'Fredoka',sans-serif;font-weight:400;font-size:16px;line-height:24px;color:#7B7B7B;margin:0;padding:0;text-align:center;">Please check your email we have sent you 4 digit code to <span style="color:#FFFFFF;">${email}</span></p>`;
    topSection.appendChild(titleGroup);

    // OTP group (gap:24px)
    const otpGroup = document.createElement('div');
    otpGroup.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:24px;width:100%;';
    topSection.appendChild(otpGroup);

    // 4 individual OTP inputs
    const boxesRow = document.createElement('div');
    boxesRow.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:8px;';
    otpGroup.appendChild(boxesRow);

    const inputs = [];
    for (let i = 0; i < 4; i++) {
        const inp = document.createElement('input');
        inp.type = 'tel';
        inp.inputMode = 'numeric';
        inp.pattern = '[0-9]*';
        inp.maxLength = 1;
        inp.className = 'otp-digit-input';
        inp.setAttribute('autocomplete', i === 0 ? 'one-time-code' : 'off');
        inp.setAttribute('aria-label', `OTP digit ${i + 1}`);

        inp.addEventListener('focus', () => {
            inp.select();
        });

        inp.addEventListener('input', (e) => {
            // Only allow single digit
            const val = inp.value.replace(/\D/g, '');
            inp.value = val ? val[val.length - 1] : '';

            if (inp.value) {
                inp.classList.add('filled');
                inp.classList.remove('error');
                // Move to next
                if (i < 3) {
                    inputs[i + 1].focus();
                } else {
                    // All 4 filled — auto validate
                    inp.blur();
                    validateOtp();
                }
            } else {
                inp.classList.remove('filled');
            }
        });

        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!inp.value && i > 0) {
                    // Move to previous and clear it
                    inputs[i - 1].value = '';
                    inputs[i - 1].classList.remove('filled');
                    inputs[i - 1].focus();
                } else {
                    inp.value = '';
                    inp.classList.remove('filled');
                }
            } else if (e.key === 'ArrowLeft' && i > 0) {
                inputs[i - 1].focus();
            } else if (e.key === 'ArrowRight' && i < 3) {
                inputs[i + 1].focus();
            }
        });

        // Handle paste on first input
        if (i === 0) {
            inp.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 4);
                for (let j = 0; j < 4; j++) {
                    inputs[j].value = pasted[j] || '';
                    if (pasted[j]) {
                        inputs[j].classList.add('filled');
                    } else {
                        inputs[j].classList.remove('filled');
                    }
                }
                if (pasted.length === 4) {
                    inputs[3].focus();
                    validateOtp();
                } else if (pasted.length > 0) {
                    inputs[Math.min(pasted.length, 3)].focus();
                }
            });
        }

        boxesRow.appendChild(inp);
        inputs.push(inp);
    }

    // Resend row with countdown timer
    const resendRow = document.createElement('div');
    resendRow.style.cssText = [
        'display:flex;flex-direction:row;justify-content:center;align-items:center;',
        'gap:7px;flex-wrap:wrap;',
    ].join('');
    otpGroup.appendChild(resendRow);

    const resendLabel = document.createElement('span');
    resendLabel.style.cssText = "font-family:'Poppins',sans-serif;font-weight:400;font-size:14px;line-height:20px;color:#FFFFFF;";
    resendLabel.textContent = 'You can resend the code in';

    const timerSpan = document.createElement('span');
    timerSpan.style.cssText = "font-family:'Poppins',sans-serif;font-weight:500;font-size:14px;line-height:20px;color:#FEC348;cursor:pointer;";
    timerSpan.textContent = '01:00';

    resendRow.appendChild(resendLabel);
    resendRow.appendChild(timerSpan);

    // Countdown timer
    let seconds = 60;
    const timerInterval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(timerInterval);
            resendLabel.textContent = "Didn't receive the code?";
            timerSpan.textContent = 'Resend Code';
            timerSpan.addEventListener('click', () => {
                // Reset
                seconds = 60;
                timerSpan.textContent = '01:00';
                resendLabel.textContent = 'You can resend the code in';
                inputs.forEach(inp => {
                    inp.value = '';
                    inp.classList.remove('filled', 'error');
                });
                inputs[0].focus();
            });
        } else {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            timerSpan.textContent = `${m}:${s}`;
        }
    }, 1000);

    // ── Bottom section: CTA ───────────────────────────────────────────────────
    const bottomSection = document.createElement('div');
    bottomSection.style.cssText = [
        'display:flex;flex-direction:column;align-items:stretch;gap:16px;',
        'padding-bottom:8px;',
    ].join('');
    content.appendChild(bottomSection);

    const btnContinue = document.createElement('button');
    btnContinue.className = 'otp-btn-continue';
    btnContinue.style.cssText = [
        'width:100%;display:flex;align-items:center;justify-content:center;',
        'background:#FEC348;border:none;border-radius:32px;',
        'padding:12px 16px;height:48px;cursor:pointer;',
        'box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;',
    ].join('');
    btnContinue.innerHTML = `<span style="font-family:'Poppins',sans-serif;font-weight:500;font-size:16px;line-height:20px;color:#0D0D0D;">Continue</span>`;
    btnContinue.addEventListener('click', () => validateOtp());
    bottomSection.appendChild(btnContinue);

    function getOtpValue() {
        return inputs.map(inp => inp.value).join('');
    }

    function setError() {
        inputs.forEach(inp => {
            inp.classList.add('error');
            inp.classList.remove('filled');
        });
        inputs[0].focus();
    }

    function validateOtp() {
        const value = getOtpValue();
        if (value.length < 4) {
            // Mark empty boxes as error
            inputs.forEach((inp, i) => {
                if (!inp.value) {
                    inp.classList.add('error');
                }
            });
            // Focus first empty
            const firstEmpty = inputs.find(inp => !inp.value);
            if (firstEmpty) firstEmpty.focus();
            return;
        }
        if (value === MOCK_OTP) {
            clearInterval(timerInterval);
            navigate('#subscription');
        } else {
            setError();
        }
    }

    // Auto-focus first input after render
    requestAnimationFrame(() => {
        inputs[0].focus();
    });

    return el;
}
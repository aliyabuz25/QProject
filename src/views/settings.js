import { state } from '../state/appState.js';
import { auth } from '../services/api.js';
import { navigate } from '../js/router.js';
import {
    areBackgroundNotificationsEnabled,
    setBackgroundNotificationsEnabled,
} from '../services/backgroundNotifications.js';
import { openTermsAndConditions, openPrivacyPolicy } from '../services/legalWebView.js';
import { googleSignOut } from '../services/googleAuth.js';
import { clearCurrentUserFavorites } from '../services/favoritesService.js';

/**
 * Profile / Settings — Figma 1:4525
 *
 * Figma reference (393×854):
 *   StatusBar:   y:0,   h:59
 *   Title row:   y:62,  h:46  (padding:10px inside, row center)
 *   Avatar row:  y:111, h:hug (padding:8px 16px 0)
 *   Settings card: x:16, y:267, w:361
 *
 * On Android the real statusbar replaces the Figma statusbar (59px).
 * We use env(safe-area-inset-top) + fixed offsets to match.
 */
export function renderSettings() {
    const avatarSrc = localStorage.getItem('selectedAvatar') || '/assets/images/avatar-memoji.png';
    const user = auth.getUser();
    const userName = (user && user.name) ? user.name : (state.user && state.user.name ? state.user.name : 'Fehruz Amirov');
    const userEmail = (user && user.email) ? user.email : 'fahr.amirov@gmail.com';

    const container = document.createElement('div');
    container.style.cssText = [
        'position:absolute',
        'inset:0',
        'height:100dvh',
        'background:#0D0D0D',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'box-sizing:border-box',
        // top padding = safe-area (replaces Figma 59px statusbar)
        'padding-top:env(safe-area-inset-top,0px)',
        'padding-left:16px',
        'padding-right:16px',
        // bottom padding = tabbar (96px) + safe-area
        'padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))',
        'color:#ffffff',
        'font-family:"Baloo 2",sans-serif',
    ].join(';');

    // ── Title row ─────────────────────────────────────────────────────────────
    // Figma: y:62 from top of screen = 59px statusbar + 3px gap
    // We replicate: after safe-area, add a 3px spacer then the 46px title row
    const titleSpacer = document.createElement('div');
    titleSpacer.style.cssText = 'width:100%;height:3px;flex-shrink:0;';
    container.appendChild(titleSpacer);

    const titleRow = document.createElement('div');
    titleRow.style.cssText = [
        'width:100%',
        'height:46px',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'flex-shrink:0',
        'padding:10px',
        'box-sizing:border-box',
    ].join(';');
    titleRow.innerHTML = `<h1 style="
        font-family:'Baloo 2',sans-serif;
        font-weight:500;
        font-size:28px;
        line-height:26px;
        margin:0;
        color:#FFFFFF;
        text-align:center;
    ">Profile</h1>`;
    container.appendChild(titleRow);

    // ── Avatar section ────────────────────────────────────────────────────────
    // Figma: y:111 = 59+3+46+3 gap. padding:8px 16px 0
    // We add a small gap then the avatar row
    const avatarGap = document.createElement('div');
    avatarGap.style.cssText = 'width:100%;height:3px;flex-shrink:0;';
    container.appendChild(avatarGap);

    const avatarSection = document.createElement('div');
    avatarSection.style.cssText = [
        'width:calc(100% + 32px)',  // extend to full width (cancel parent 16px padding)
        'margin-left:-16px',
        'margin-right:-16px',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'flex-shrink:0',
        'padding:8px 16px 0',
        'box-sizing:border-box',
        'gap:8px',
    ].join(';');

    // Avatar wrap: 96×96 with edit button at bottom-right (x:64,y:64 in Figma = right:0,bottom:0)
    avatarSection.innerHTML = `
        <div id="avatar-tap-area" style="
            position:relative;
            width:96px;height:96px;
            flex-shrink:0;
            cursor:pointer;
        ">
            <div style="
                position:absolute;inset:0;
                border-radius:100px;
                overflow:hidden;
            ">
                <img id="settings-avatar-img" src="${avatarSrc}" style="
                    width:100%;height:100%;
                    object-fit:cover;
                    pointer-events:none;
                " />
            </div>
            <div style="
                position:absolute;right:0;bottom:0;
                width:32px;height:32px;
                background:#FEC348;
                border:3px solid #FFFFFF;
                border-radius:100px;
                display:flex;align-items:center;justify-content:center;
                box-sizing:border-box;
            ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <p style="
                font-family:'Baloo 2',sans-serif;
                font-weight:600;font-size:20px;line-height:1.4;
                color:#FFFFFF;margin:0;text-align:center;
            ">${userName}</p>
            <p style="
                font-family:'Baloo 2',sans-serif;
                font-weight:400;font-size:14px;line-height:1.4;
                color:#6e6e6e;margin:0;text-align:center;
            ">${userEmail}</p>
        </div>
    `;
    container.appendChild(avatarSection);

    // ── Settings card ─────────────────────────────────────────────────────────
    // Figma: x:16, y:267, width:361, bg:#131313, border:#191919, radius:12px, gap:4px
    // y:267 from screen top. After safe-area + 3 + 46 + 3 + avatar section height.
    // Avatar section: padding-top:8px + 96px avatar + 8px gap + ~20px name + ~20px email + 0 bottom = ~152px
    // 59 + 3 + 46 + 3 + 8 + 96 + 8 + ~47 = ~270 ≈ 267. Use margin-top to fine-tune.
    const cardGap = document.createElement('div');
    cardGap.style.cssText = 'width:100%;height:16px;flex-shrink:0;';
    container.appendChild(cardGap);

    const list = document.createElement('div');
    list.style.cssText = [
        'width:100%',
        'max-width:361px',
        'background:#131313',
        'border:1px solid #191919',
        'border-radius:12px',
        'display:flex',
        'flex-direction:column',
        'align-items:stretch',
        'box-sizing:border-box',
        'flex-shrink:0',
        'overflow:hidden',
        'gap:4px',
    ].join(';');

    // Row helper: each row is a wrapper div (padding:0 16px) containing the inner row
    // Inner row: row, justify-space-between, align-center, padding:12px 0, border-bottom:0.5px #363636
    const iconWrap = `width:32px;height:32px;border-radius:50%;background:#222222;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
    const labelStyle = (c) => `font-family:'Baloo 2',sans-serif;font-weight:400;font-size:18px;line-height:28px;color:${c};white-space:nowrap;`;
    const chevronBtn = `<div style="${iconWrap}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="#6e6e6e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;

    const feedback = document.createElement('div');
    feedback.style.cssText = [
        'width:100%',
        'max-width:361px',
        'margin-top:12px',
        'padding:12px 14px',
        'border-radius:12px',
        'box-sizing:border-box',
        'font-size:14px',
        'line-height:20px',
        'display:none',
    ].join(';');

    function showFeedback(message, tone = 'neutral') {
        if (!message) {
            feedback.style.display = 'none';
            feedback.textContent = '';
            return;
        }

        const tones = {
            neutral: { background: '#1B1B1B', color: '#CED4DA', border: '#2C2C2C' },
            success: { background: 'rgba(63,156,53,0.16)', color: '#65C95A', border: 'rgba(63,156,53,0.3)' },
            error: { background: 'rgba(255,59,48,0.12)', color: '#FF8E88', border: 'rgba(255,59,48,0.3)' },
        };
        const palette = tones[tone] || tones.neutral;
        feedback.style.display = 'block';
        feedback.style.background = palette.background;
        feedback.style.color = palette.color;
        feedback.style.border = `1px solid ${palette.border}`;
        feedback.textContent = message;
    }

    function resetClientAccountState({ clearFavorites = false } = {}) {
        if (clearFavorites) clearCurrentUserFavorites();
        auth.logout();
        state.activeProduct = null;
        state.activeTrack = null;
        state.activeVideo = null;
        state.activeFavoritesTab = 'audio';
    }

    function makeRow({ icon, label, labelColor, right, onclick, hasBorder }) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'padding:0 16px;box-sizing:border-box;';

        const inner = document.createElement('button');
        inner.style.cssText = [
            'display:flex',
            'align-items:center',
            'justify-content:space-between',
            'width:100%',
            'padding:12px 0',
            'background:transparent',
            'border:none',
            'border-left:none',
            'border-right:none',
            'border-top:none',
            hasBorder ? 'border-bottom:0.5px solid #363636' : 'border-bottom:none',
            'cursor:pointer',
            'text-align:left',
            'box-sizing:border-box',
        ].join(';');

        if (onclick) inner.onclick = onclick;

        inner.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="${iconWrap}">${icon}</div>
                <span style="${labelStyle(labelColor)}">${label}</span>
            </div>
            ${right}
        `;
        wrapper.appendChild(inner);
        return wrapper;
    }

    const rows = [
        {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#ced4da" stroke-width="1.5"/><path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="#ced4da" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            label: 'Account', labelColor: '#CED4DA',
            right: chevronBtn,
            onclick: () => navigate('#account'),
            hasBorder: true,
        },
        {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#ced4da" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
            label: 'Favorites', labelColor: '#CED4DA',
            right: chevronBtn,
            onclick: () => navigate('#favorites'),
            hasBorder: true,
        },
        null, // Notifications row handled separately below
        {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7L14 2Z" stroke="#ced4da" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 2V7H19" stroke="#ced4da" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 13H15M9 17H13" stroke="#ced4da" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            label: 'Terms & Conditions', labelColor: '#CED4DA',
            right: chevronBtn,
            onclick: () => openTermsAndConditions(),
            hasBorder: true,
        },
        {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#ced4da" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
            label: "Privacy Policy", labelColor: '#CED4DA',
            right: chevronBtn,
            onclick: () => openPrivacyPolicy(),
            hasBorder: true,
        },
        {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="#cb2d24" stroke-width="1.5" stroke-linecap="round"/><path d="M16 17L21 12L16 7" stroke="#cb2d24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="#cb2d24" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            label: 'Log out', labelColor: '#CB2D24',
            right: '',
            onclick: async (event) => {
                const button = event?.currentTarget;
                if (button?.disabled) return;
                if (button) button.disabled = true;
                resetClientAccountState();
                await googleSignOut();
                navigate('#onboarding');
            },
            hasBorder: true,
        },
        {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21" stroke="#ff3b30" stroke-width="1.5" stroke-linecap="round"/><path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6L18 20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20L5 6H19Z" stroke="#ff3b30" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
            label: 'Delete account', labelColor: '#FF3B30',
            right: '',
            onclick: async (event) => {
                const button = event?.currentTarget;
                if (button?.disabled) return;

                const confirmed = window.confirm('Delete your account permanently? This cannot be undone.');
                if (!confirmed) return;

                if (button) {
                    button.disabled = true;
                    button.style.opacity = '0.6';
                    button.style.cursor = 'default';
                }

                showFeedback('Deleting your account...', 'neutral');

                const result = await auth.deleteAccount();
                if (!result.ok) {
                    showFeedback(result.error || 'We could not delete your account right now.', 'error');
                    if (button) {
                        button.disabled = false;
                        button.style.opacity = '1';
                        button.style.cursor = 'pointer';
                    }
                    return;
                }

                resetClientAccountState({ clearFavorites: true });
                try { await googleSignOut(); } catch {}
                showFeedback('Your account was deleted successfully.', 'success');
                setTimeout(() => navigate('#onboarding'), 200);
            },
            hasBorder: false,
        },
    ];

    // Build Notifications row: left side navigates, right side toggles
    function makeNotificationsRow() {
        const isOn = areBackgroundNotificationsEnabled();

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'padding:0 16px;box-sizing:border-box;';

        const inner = document.createElement('div');
        inner.style.cssText = [
            'display:flex',
            'align-items:center',
            'justify-content:space-between',
            'width:100%',
            'padding:12px 0',
            'border-bottom:0.5px solid #363636',
            'box-sizing:border-box',
        ].join(';');

        // Left: clickable nav button (icon + text)
        const navBtn = document.createElement('button');
        navBtn.type = 'button';
        navBtn.style.cssText = [
            'flex:1',
            'height:100%',
            'display:flex',
            'align-items:center',
            'gap:8px',
            'background:transparent',
            'border:none',
            'padding:0',
            'cursor:pointer',
            'text-align:left',
        ].join(';');
        navBtn.setAttribute('aria-label', 'Open notifications');
        navBtn.onclick = () => { window.location.hash = '#notifications'; };
        navBtn.innerHTML = `
            <div style="${iconWrap}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#ced4da" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#ced4da" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <span style="${labelStyle('#CED4DA')}">Notifications</span>
        `;

        // Right: toggle switch
        const switchBtn = document.createElement('button');
        switchBtn.type = 'button';
        switchBtn.id = 'notif-toggle';
        switchBtn.setAttribute('aria-label', 'Toggle notifications');
        switchBtn.style.cssText = [
            'width:32px',
            'height:19px',
            'border:none',
            'border-radius:100px',
            `background:${isOn ? '#FEC348' : '#343A40'}`,
            'position:relative',
            'flex-shrink:0',
            'cursor:pointer',
            'padding:0',
        ].join(';');

        const thumb = document.createElement('span');
        thumb.style.cssText = [
            'width:16px',
            'height:16px',
            'border-radius:50%',
            'background:#FFFFFF',
            'position:absolute',
            'top:1.5px',
            'left:2px',
            'transition:transform 160ms ease',
            `transform:${isOn ? 'translateX(13px)' : 'translateX(0px)'}`,
            'display:block',
        ].join(';');
        switchBtn.appendChild(thumb);

        switchBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const current = areBackgroundNotificationsEnabled();
            const next = !current;
            switchBtn.style.background = next ? '#FEC348' : '#343A40';
            thumb.style.transform = next ? 'translateX(13px)' : 'translateX(0px)';
            try {
                await setBackgroundNotificationsEnabled(next);
            } catch (error) {
                console.error('[NOTIFICATIONS] Could not update notification setting:', error);
            }
        };

        inner.appendChild(navBtn);
        inner.appendChild(switchBtn);
        wrapper.appendChild(inner);
        return wrapper;
    }

    rows.forEach(r => {
        if (r === null) {
            list.appendChild(makeNotificationsRow());
        } else {
            list.appendChild(makeRow(r));
        }
    });
    container.appendChild(list);
    container.appendChild(feedback);

    // ── Avatar tap → avatar screen ────────────────────────────────────────────
    container.querySelector('#avatar-tap-area').addEventListener('click', () => {
        window.location.hash = '#avatar';
    });

    return container;
}

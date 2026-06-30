/**
 * Shared Tab Bar Component — Premium iOS-style animations
 *
 * Tab order (matches Figma Tabbar component 1:1277):
 *   Home | Story | Audio | Game | Profile
 * Routes:
 *   #home | #story | #audio | #shop | #profile
 *
 * Icons: exact SVG paths exported from Figma file caVV6rxU4vHZjILKNKMY5F
 * Active color: #FEC348 | Inactive color: #9DA3AD
 *
 * Animations:
 *   - Icon: spring scale bounce on tap (1 → 0.82 → 1.18 → 1.0)
 *   - Label: smooth color + weight transition (200ms ease-out)
 *   - Active pill: sliding indicator that moves between tabs
 *   - Tap feedback: immediate haptic-style scale response
 */

// ─── EXACT FIGMA SVG PATHS ────────────────────────────────────────────────────

function homeIcon(color) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip-home-${color === '#fec348' ? 'a' : 'i'})">
<mask id="mask-home-a-${color === '#fec348' ? 'a' : 'i'}" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
<path d="M0 0H24V24H0V0Z" fill="white"/>
</mask>
<g mask="url(#mask-home-a-${color === '#fec348' ? 'a' : 'i'})">
<mask id="mask-home-b-${color === '#fec348' ? 'a' : 'i'}" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
<path d="M0 0H24V24H0V0Z" fill="white"/>
</mask>
<g mask="url(#mask-home-b-${color === '#fec348' ? 'a' : 'i'})">
<path d="M19.25 21.0004C20.2165 21.0004 21 20.2169 21 19.2504V8.32856C21 8.021 20.9189 7.71888 20.765 7.45263C20.611 7.18638 20.3896 6.9654 20.1231 6.81196L12.8731 2.63766C12.6075 2.48477 12.3064 2.4043 12 2.4043C11.6936 2.4043 11.3925 2.48477 11.1269 2.63766L3.8769 6.81196C3.61036 6.9654 3.38896 7.18638 3.23501 7.45263C3.08107 7.71888 3.00001 8.021 3 8.32856V19.2504C3 20.2169 3.7835 21.0004 4.75 21.0004H8.75C9.7165 21.0004 10.5 20.2169 10.5 19.2504V14.5004H13.5V19.2504C13.5 20.2169 14.2835 21.0004 15.25 21.0004H19.25ZM19.3747 8.11196C19.4128 8.13387 19.4444 8.16543 19.4664 8.20345C19.4884 8.24148 19.5 8.28463 19.5 8.32856V19.2504C19.5 19.3167 19.4737 19.3802 19.4268 19.4271C19.3799 19.474 19.3163 19.5004 19.25 19.5004H15.25C15.1837 19.5004 15.1201 19.474 15.0732 19.4271C15.0263 19.3802 15 19.3167 15 19.2504V13.7504C15 13.5514 14.921 13.3607 14.7803 13.22C14.6397 13.0794 14.4489 13.0004 14.25 13.0004H9.75C9.55109 13.0004 9.36032 13.0794 9.21967 13.22C9.07902 13.3607 9 13.5514 9 13.7504V19.2504C9 19.3167 8.97366 19.3802 8.92678 19.4271C8.87989 19.474 8.8163 19.5004 8.75 19.5004H4.75C4.6837 19.5004 4.62011 19.474 4.57322 19.4271C4.52634 19.3802 4.5 19.3167 4.5 19.2504V8.32856C4.50001 8.28463 4.5116 8.24148 4.5336 8.20345C4.5556 8.16543 4.58723 8.13387 4.6253 8.11196L11.8753 3.93756C11.9132 3.91573 11.9562 3.90424 12 3.90424C12.0438 3.90424 12.0868 3.91573 12.1247 3.93756L19.3747 8.11196Z" fill="${color}"/>
</g>
</g>
</g>
<defs>
<clipPath id="clip-home-${color === '#fec348' ? 'a' : 'i'}">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>`;
}

function storyIcon(color) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.33333 3.00001C7.79379 2.99657 10.1685 3.88709 12 5.5V21C10.1685 19.3871 7.79379 18.4966 5.33333 18.5C3.77132 18.5 2.99032 18.5 2.64526 18.2792C2.4381 18.1466 2.35346 18.0619 2.22086 17.8547C2 17.5097 2 16.8941 2 15.6629V6.40322C2 4.97543 2 4.26154 2.54874 3.68286C3.09748 3.10418 3.65923 3.07432 4.78272 3.0146C4.965 3.00491 5.14858 3.00001 5.33333 3.00001Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.6667 3.00001C16.2062 2.99657 13.8315 3.88709 12 5.5V21C13.8315 19.3871 16.2062 18.4966 18.6667 18.5C20.2287 18.5 21.0097 18.5 21.3547 18.2792C21.5619 18.1466 21.6465 18.0619 21.7791 17.8547C22 17.5097 22 16.8941 22 15.6629V6.40322C22 4.97543 22 4.26154 21.4513 3.68286C20.9025 3.10418 20.3408 3.07432 19.2173 3.0146C19.035 3.00491 18.8514 3.00001 18.6667 3.00001Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function audioIcon(color) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.0849 17C20.5849 15.5 21 13.4368 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4368 3.41512 15.5 3.91512 17" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.97651 19.6043L7.23857 14.6127C7.05341 14.1466 6.4617 13.9131 5.97493 14.0297C4.46441 14.5333 3.6462 16.1718 4.14742 17.6895L4.58543 19.0158C5.08664 20.5334 6.71747 21.3555 8.22799 20.8519C8.68896 20.6556 9.10449 20.0897 8.97651 19.6043Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15.0235 19.6043L16.7614 14.6127C16.9466 14.1466 17.5383 13.9131 18.0251 14.0297C19.5356 14.5333 20.3538 16.1718 19.8526 17.6895L19.4146 19.0158C18.9134 20.5334 17.2825 21.3555 15.772 20.8519C15.311 20.6556 14.8955 20.0897 15.0235 19.6043Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function gameIcon(color) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M3.01482 18.0594C3.66096 18.6865 4.44014 19 5.35234 19C5.99088 19 6.58381 18.8396 7.13113 18.5188C7.67845 18.1979 8.08894 17.7604 8.3626 17.2063C8.67352 16.6032 8.82897 16.3016 9.05443 16.0785C9.27607 15.8591 9.54593 15.6946 9.84245 15.5982C10.1441 15.5 10.4834 15.5 11.1619 15.5H12.841C13.5004 15.5 13.8301 15.5 14.1236 15.5925C14.4382 15.6917 14.7233 15.8671 14.9537 16.1032C15.1686 16.3234 15.3173 16.6177 15.6146 17.2063C15.8883 17.7604 16.2988 18.1979 16.8461 18.5188C17.3934 18.8396 17.9864 19 18.6249 19C19.5523 19 20.3467 18.6901 21.008 18.0703C21.6694 17.4505 22 16.6958 22 15.8063C22 15.675 21.9886 15.5401 21.9658 15.4016C21.943 15.263 21.9164 15.1281 21.886 14.9969L20.8403 10.983C20.0911 8.10773 19.7166 6.67008 18.6361 5.83504C17.5556 5 16.07 5 13.0987 5H10.8855C7.91884 5 6.43552 5 5.3558 5.83306C4.27608 6.66613 3.89978 8.10093 3.14719 10.9705L2.09122 14.9969C2.06081 15.1281 2.03801 15.2594 2.0228 15.3906C2.0076 15.5219 2 15.6531 2 15.7844C2.0304 16.674 2.36868 17.4323 3.01482 18.0594Z" stroke="${color}" stroke-width="1.5"/>
<path d="M8.495 8.50781V12.5078M10.5 10.5028H6.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.75 9.125V9.25M17 9.25C17 9.38807 16.8881 9.5 16.75 9.5C16.6119 9.5 16.5 9.38807 16.5 9.25C16.5 9.11193 16.6119 9 16.75 9C16.8881 9 17 9.11193 17 9.25Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.25 11.625V11.75M14.5 11.75C14.5 11.8881 14.3881 12 14.25 12C14.1119 12 14 11.8881 14 11.75C14 11.6119 14.1119 11.5 14.25 11.5C14.3881 11.5 14.5 11.6119 14.5 11.75Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function profileIcon(color) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.5 12C3.5 7.3056 7.3056 3.5 12 3.5C16.6944 3.5 20.5 7.3056 20.5 12C20.5 14.1137 19.726 16.0451 18.4492 17.5322C17.6526 16.0268 16.0723 15.0002 14.25 15H9.75C7.9276 15.0002 6.3464 16.0266 5.5498 17.5322C4.2732 16.0452 3.5 14.1135 3.5 12ZM6.6973 18.6406C7.1509 17.3925 8.3459 16.5002 9.75 16.5H14.25C15.6538 16.5002 16.8489 17.3919 17.3027 18.6396C16.4706 19.3058 15.5206 19.8095 14.5023 20.1245C13.6917 20.3743 12.8482 20.5008 12 20.5C11.1373 20.5008 10.2795 20.3699 9.4563 20.1119C8.45348 19.7965 7.51795 19.2976 6.6973 18.6406ZM22 12C22 6.4772 17.5228 2 12 2C6.4772 2 2 6.4772 2 12C2 17.5228 6.4772 22 12 22C14.5644 22 16.9019 21.0333 18.6719 19.4463C18.6756 19.4428 18.68 19.4401 18.6836 19.4365C20.719 17.606 22 14.953 22 12Z" fill="${color}"/>
<path d="M9.5 9.5C9.5 8.1193 10.6193 7 12 7C13.3807 7 14.5 8.1193 14.5 9.5C14.5 10.8807 13.3807 12 12 12C10.6193 12 9.5 10.8807 9.5 9.5ZM16 9.5C16 7.2909 14.2091 5.5 12 5.5C9.7909 5.5 8 7.2909 8 9.5C8 11.7091 9.7909 13.5 12 13.5C14.2091 13.5 16 11.7091 16 9.5Z" fill="${color}"/>
</svg>`;
}

const ACTIVE = '#fec348';
const INACTIVE = '#9da3ad';

export const TABS = [
    { id: 'home',    label: 'Home',    href: '#home',    iconFn: homeIcon    },
    { id: 'story',   label: 'Story',   href: '#story',   iconFn: storyIcon   },
    { id: 'audio',   label: 'Audio',   href: '#audio',   iconFn: audioIcon   },
    { id: 'shop',    label: 'Game',    href: '#shop',    iconFn: gameIcon     },
    { id: 'profile', label: 'Profile', href: '#profile', iconFn: profileIcon },
];

// Tab index map for directional transitions
export const TAB_INDEX = Object.fromEntries(TABS.map((t, i) => [t.id, i]));

/**
 * Spring animation helper — simulates iOS spring physics using rAF.
 * @param {HTMLElement} el - element to animate
 * @param {string} prop - CSS property (e.g. 'transform')
 * @param {string} from - start value
 * @param {string} to - end value
 * @param {Object} opts - { stiffness, damping, mass, duration }
 */
function springAnimate(el, keyframes, options) {
    if (!el || !el.animate) return;
    return el.animate(keyframes, {
        duration: options.duration || 400,
        easing: options.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards',
    });
}

/**
 * Returns a tab bar DOM Element with premium iOS-style animations.
 * @param {string} activeTab - one of: 'home' | 'story' | 'audio' | 'shop' | 'profile'
 * @returns {HTMLElement}
 */
export function createTabbar(activeTab = 'home') {
    const wrapper = document.createElement('nav');
    wrapper.className = 'tabbar-wrapper';
    wrapper.setAttribute('role', 'navigation');
    wrapper.setAttribute('aria-label', 'Main navigation');
    wrapper.dataset.activeTab = activeTab;

    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    const pillLeft = activeIdx >= 0 ? `${(activeIdx / TABS.length) * 100}%` : '0%';
    const pillWidth = `${100 / TABS.length}%`;

    wrapper.innerHTML = `
        <style>
            .tabbar-wrapper {
                /* Positioning is set by the router via inline style.
                   Default here is absolute bottom so it works in both
                   global (router-managed) and standalone contexts. */
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                z-index: 9999;
                background-color: #0d0d0d;
                border-top: 1px solid #1f1f1f;
                padding-bottom: env(safe-area-inset-bottom, 0px);
                /* GPU-accelerated layer */
                will-change: transform;
                transform: translateZ(0);
            }
            .tabbar-inner {
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
            /* Sliding active pill indicator */
            .tabbar-pill {
                position: absolute;
                top: 6px;
                left: ${pillLeft};
                width: ${pillWidth};
                height: 3px;
                background: #fec348;
                border-radius: 2px;
                transition: left 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
                will-change: left;
                pointer-events: none;
            }
            .tabbar-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                gap: 4px;
                flex: 1;
                height: 100%;
                text-decoration: none;
                color: #9da3ad;
                font-family: 'Baloo 2', sans-serif;
                font-size: 12px;
                font-weight: 400;
                line-height: 1;
                -webkit-tap-highlight-color: transparent;
                min-width: 48px;
                padding: 4px 0;
                cursor: pointer;
                /* Smooth color + weight transition */
                transition: color 200ms ease-out;
                /* GPU layer for icon animations */
                will-change: transform;
                transform: translateZ(0);
                user-select: none;
                -webkit-user-select: none;
            }
            .tabbar-item.active {
                color: #fec348;
                font-weight: 500;
            }
            .tabbar-item svg {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
                /* Smooth SVG color transition via filter */
                transition: transform 200ms ease-out;
                will-change: transform;
            }
            .tabbar-item span {
                font-size: 12px;
                line-height: 1.2;
                text-align: center;
                transition: color 200ms ease-out, font-weight 200ms ease-out;
            }
            /* Icon wrapper for isolated scale animation */
            .tabbar-icon-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                will-change: transform;
                transform: translateZ(0);
            }
        </style>
        <div class="tabbar-inner">
            <div class="tabbar-pill" id="tabbar-pill"></div>
            ${TABS.map(tab => {
                const isActive = tab.id === activeTab;
                const color = isActive ? ACTIVE : INACTIVE;
                return `
                    <a href="${tab.href}"
                       class="tabbar-item${isActive ? ' active' : ''}"
                       aria-label="${tab.label}"
                       ${isActive ? 'aria-current="page"' : ''}
                       data-tab="${tab.id}">
                        <div class="tabbar-icon-wrap" data-icon="${tab.id}">
                            ${tab.iconFn(color)}
                        </div>
                        <span>${tab.label}</span>
                    </a>
                `;
            }).join('')}
        </div>
    `;

    // ── Animate icon on tap ───────────────────────────────────────────────────
    const pill = wrapper.querySelector('#tabbar-pill');
    const items = wrapper.querySelectorAll('.tabbar-item');

    items.forEach((item, idx) => {
        const iconWrap = item.querySelector('.tabbar-icon-wrap');
        const tabId = item.dataset.tab;

        item.addEventListener('pointerdown', () => {
            // Immediate press feedback — compress
            if (iconWrap) {
                iconWrap.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(0.82)' },
                ], { duration: 80, easing: 'ease-out', fill: 'forwards' });
            }
        });

        item.addEventListener('pointerup', () => {
            if (iconWrap) {
                // Spring bounce: compress → overshoot → settle
                iconWrap.animate([
                    { transform: 'scale(0.82)' },
                    { transform: 'scale(1.18)' },
                    { transform: 'scale(0.96)' },
                    { transform: 'scale(1.0)' },
                ], {
                    duration: 380,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    fill: 'forwards',
                });
            }
        });

        item.addEventListener('pointercancel', () => {
            if (iconWrap) {
                iconWrap.animate([{ transform: 'scale(1)' }], { duration: 150, fill: 'forwards' });
            }
        });

        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = tabId;
            const currentActive = wrapper.dataset.activeTab;
            if (targetTab === currentActive) return;

            // Update pill position with spring slide
            const newIdx = TABS.findIndex(t => t.id === targetTab);
            if (pill) {
                pill.style.left = `${(newIdx / TABS.length) * 100}%`;
            }

            // Update active states
            items.forEach((it, i) => {
                const isNowActive = it.dataset.tab === targetTab;
                const iw = it.querySelector('.tabbar-icon-wrap');
                const span = it.querySelector('span');

                if (isNowActive) {
                    it.classList.add('active');
                    it.setAttribute('aria-current', 'page');
                    if (iw) iw.innerHTML = TABS[i].iconFn(ACTIVE);
                } else {
                    it.classList.remove('active');
                    it.removeAttribute('aria-current');
                    if (iw) iw.innerHTML = TABS[i].iconFn(INACTIVE);
                }
            });

            wrapper.dataset.activeTab = targetTab;

            // Navigate
            window.location.hash = TABS[newIdx].href;
        });
    });

    return wrapper;
}

/**
 * Legacy string-based helper — kept for backward compatibility.
 * @deprecated Use createTabbar() instead.
 */
export function renderTabbar(activeTab = 'home') {
    const el = createTabbar(activeTab);
    return el.outerHTML;
}

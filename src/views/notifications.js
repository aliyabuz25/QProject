import { api } from '../services/api.js';
import { navigate } from '../js/router.js';

/**
 * Notifications screen — all 4 states:
 *   1. List with approval actions (V2 / default)
 *   2. Approved state (V1 / Approved)
 *   3. Declined state (V1 / Request declined)
 *   4. Empty state
 *
 * Design tokens (from Figma):
 *   bg: #0D0D0D
 *   card bg: #121212, border: #1B1B1B, radius: 12px
 *   header back btn: 44×44 bg:#292929 radius:100px
 *   title: Baloo2 SemiBold 24px/32px #FFF center
 *   check btn: 32×32 border:1px solid #FEC348 radius:100px, icon #FEC348
 *   notification title: Baloo2 SemiBold 16px/24px #FFF
 *   notification body: Baloo2 Regular 14px/20px #ADB5BD
 *   time: Baloo2 Regular 12px/16px #646464
 *   status dot: 8×8 circle, color: #FEC348 (unread) / #646464 (read)
 *   Approve btn: bg:#FEC348 radius:32px padding:8px 16px Baloo2 Medium 14px/20px #000
 *   Decline btn: bg:transparent border:1px solid #FEC348 radius:32px padding:8px 16px Baloo2 Medium 14px/20px #FEC348
 *   Approved badge: bg:rgba(254,195,72,0.15) border:1px solid #FEC348 radius:32px padding:4px 12px Baloo2 Medium 12px/16px #FEC348
 *   Declined badge: same style as Approved badge (same accent system)
 *   empty bell: SVG illustration, centered
 *
 * Accent: #FEC348 (Figma fill_X7WOT6 — used on subscription CTA, "See moree" button)
 */

// Figma primary accent color
const ACCENT = '#FEC348';
const ACCENT_BG = 'rgba(254,195,72,0.15)';

export function renderNotifications() {
    const container = document.createElement('div');
    container.style.cssText = [
        'position:absolute;inset:0;',
        'background:#0D0D0D;',
        'overflow-y:auto;',
        '-webkit-overflow-scrolling:touch;',
        'display:flex;flex-direction:column;',
        'align-items:stretch;',
    ].join('');

    // ── Header ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = [
        'display:flex;flex-direction:row;',
        'align-items:center;',
        'justify-content:space-between;',
        'padding:calc(env(safe-area-inset-top,0px) + 8px) 16px 18px 16px;',
        'flex-shrink:0;',
        'width:100%;',
        'box-sizing:border-box;',
    ].join('');

    // Back button — bg:#292929 (Figma fill_PEZU0Z)
    const backBtn = document.createElement('button');
    backBtn.style.cssText = [
        'width:44px;height:44px;',
        'border-radius:100px;',
        'background:#292929;',
        'border:none;',
        'display:flex;align-items:center;justify-content:center;',
        'cursor:pointer;flex-shrink:0;',
        'padding:0;',
    ].join('');
    backBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    backBtn.addEventListener('click', () => navigate('#profile'));

    // Title
    const title = document.createElement('h1');
    title.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:600;font-size:24px;line-height:32px;',
        'color:#FFFFFF;margin:0;padding:0;',
        'text-align:center;flex:1;',
    ].join('');
    title.textContent = 'Notifications';

    // Right slot — filled with check button when list has items
    const rightSlot = document.createElement('div');
    rightSlot.style.cssText = 'width:44px;height:44px;flex-shrink:0;';

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(rightSlot);
    container.appendChild(header);

    // ── Content area ──────────────────────────────────────────────────────────
    const content = document.createElement('div');
    content.style.cssText = [
        'display:flex;flex-direction:column;',
        'align-items:stretch;',
        'gap:12px;',
        'padding:0 16px calc(env(safe-area-inset-bottom,0px) + 96px) 16px;',
        'flex:1;',
        'box-sizing:border-box;',
    ].join('');
    container.appendChild(content);

    // ── Load data ─────────────────────────────────────────────────────────────
    api.getNotifications().then((data) => {
        const notifications = data || [];

        if (notifications.length === 0) {
            renderEmptyState(content);
            return;
        }

        // Add check/mark-all-read button — yellow accent border + icon
        rightSlot.style.cssText = 'width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;';
        const checkBtn = document.createElement('button');
        checkBtn.style.cssText = [
            'width:32px;height:32px;',
            'border-radius:100px;',
            `border:1px solid ${ACCENT};`,
            'background:transparent;',
            'display:flex;align-items:center;justify-content:center;',
            'cursor:pointer;padding:0;',
        ].join('');
        checkBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 12L9 17L20 6" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        rightSlot.appendChild(checkBtn);

        // Render each notification card
        notifications.forEach((notif) => {
            const card = renderNotificationCard(notif);
            content.appendChild(card);
        });
    });

    return container;
}

// ── Notification card ─────────────────────────────────────────────────────────
function renderNotificationCard(notif) {
    const card = document.createElement('div');
    // Figma card: bg:#121212, border:#1B1B1B, radius:12px (fill_5GS57V, fill_SPERBR)
    card.style.cssText = [
        'background:#121212;',
        'border:1px solid #1B1B1B;',
        'border-radius:12px;',
        'padding:12px;',
        'display:flex;flex-direction:column;',
        'gap:8px;',
        'width:100%;box-sizing:border-box;',
        'flex-shrink:0;',
    ].join('');

    // Top row: title + time + dot
    const topRow = document.createElement('div');
    topRow.style.cssText = [
        'display:flex;flex-direction:row;',
        'align-items:center;',
        'justify-content:space-between;',
        'width:100%;',
    ].join('');

    const notifTitle = document.createElement('p');
    notifTitle.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:600;font-size:16px;line-height:24px;',
        'color:#FFFFFF;margin:0;padding:0;',
        'flex:1;',
    ].join('');
    notifTitle.textContent = notif.title;

    const metaRow = document.createElement('div');
    metaRow.style.cssText = [
        'display:flex;flex-direction:row;',
        'align-items:center;gap:8px;',
        'flex-shrink:0;margin-left:8px;',
    ].join('');

    const timeLabel = document.createElement('span');
    // Figma time color: fill_F95N7Q '#646464'
    timeLabel.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:400;font-size:12px;line-height:16px;',
        'color:#646464;white-space:nowrap;',
    ].join('');
    timeLabel.textContent = notif.time;

    // Status dot — yellow accent for unread, gray for read
    const dot = document.createElement('div');
    const dotColor = notif.read ? '#646464' : ACCENT;
    dot.style.cssText = [
        'width:8px;height:8px;',
        'border-radius:50%;',
        'flex-shrink:0;',
        `background:${dotColor};`,
    ].join('');

    metaRow.appendChild(timeLabel);
    metaRow.appendChild(dot);
    topRow.appendChild(notifTitle);
    topRow.appendChild(metaRow);
    card.appendChild(topRow);

    // Body text — Figma fill_JX8MRU '#ADB5BD'
    const body = document.createElement('p');
    body.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:400;font-size:14px;line-height:20px;',
        'color:#ADB5BD;margin:0;padding:0;',
        'width:100%;',
    ].join('');
    body.textContent = notif.body;
    card.appendChild(body);

    // Approval actions
    if (notif.type === 'approval' && notif.status === 'pending') {
        const actionRow = document.createElement('div');
        actionRow.style.cssText = [
            'display:flex;flex-direction:row;',
            'gap:8px;margin-top:4px;',
        ].join('');

        // Decline — transparent bg, yellow border + text
        const declineBtn = document.createElement('button');
        declineBtn.style.cssText = [
            'flex:1;',
            'background:transparent;',
            `border:1px solid ${ACCENT};`,
            'border-radius:32px;',
            'padding:8px 16px;',
            'font-family:"Baloo 2",sans-serif;',
            'font-weight:500;font-size:14px;line-height:20px;',
            `color:${ACCENT};`,
            'cursor:pointer;',
        ].join('');
        declineBtn.textContent = 'Decline';
        declineBtn.addEventListener('click', () => {
            notif.status = 'declined';
            updateCardStatus(card, 'declined');
        });

        // Approve — yellow bg, black text
        const approveBtn = document.createElement('button');
        approveBtn.style.cssText = [
            'flex:1;',
            `background:${ACCENT};`,
            'border:none;',
            'border-radius:32px;',
            'padding:8px 16px;',
            'font-family:"Baloo 2",sans-serif;',
            'font-weight:500;font-size:14px;line-height:20px;',
            'color:#000000;',
            'cursor:pointer;',
        ].join('');
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', () => {
            notif.status = 'approved';
            updateCardStatus(card, 'approved');
        });

        actionRow.appendChild(declineBtn);
        actionRow.appendChild(approveBtn);
        card.appendChild(actionRow);
    } else if (notif.status === 'approved') {
        card.appendChild(makeStatusBadge('approved'));
    } else if (notif.status === 'declined') {
        card.appendChild(makeStatusBadge('declined'));
    }

    return card;
}

function makeStatusBadge(status) {
    const badge = document.createElement('div');
    const isApproved = status === 'approved';
    // Both states use the same yellow accent system
    badge.style.cssText = [
        'display:inline-flex;align-items:center;gap:6px;',
        'align-self:flex-start;',
        `background:${ACCENT_BG};`,
        `border:1px solid ${ACCENT};`,
        'border-radius:32px;',
        'padding:4px 12px;',
        'margin-top:4px;',
    ].join('');

    const icon = document.createElement('span');
    icon.style.cssText = 'display:flex;align-items:center;';
    icon.innerHTML = isApproved
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 12L9 17L20 6" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const label = document.createElement('span');
    label.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:500;font-size:12px;line-height:16px;',
        `color:${ACCENT};`,
    ].join('');
    label.textContent = isApproved ? 'Approved' : 'Request declined';

    badge.appendChild(icon);
    badge.appendChild(label);
    return badge;
}

function updateCardStatus(card, status) {
    // Remove action row (last child if it has buttons)
    const lastChild = card.lastElementChild;
    if (lastChild && lastChild.querySelector('button')) {
        card.removeChild(lastChild);
    }
    card.appendChild(makeStatusBadge(status));
    // Update dot to accent color
    const dot = card.querySelector('[style*="border-radius:50%"]');
    if (dot) dot.style.background = ACCENT;
}

// ── Empty state ───────────────────────────────────────────────────────────────
function renderEmptyState(container) {
    container.style.cssText = [
        'display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'flex:1;',
        'padding:0 16px calc(env(safe-area-inset-bottom,0px) + 96px) 16px;',
        'box-sizing:border-box;',
    ].join('');

    const emptyState = document.createElement('div');
    emptyState.style.cssText = [
        'width:min(361px, 100%);',
        'display:flex;flex-direction:column;',
        'align-items:center;',
        'gap:16px;',
        'margin:0 auto;',
        'transform:translateY(-18px);',
    ].join('');

    // High-res bell illustration exported from Figma.
    const bellImage = document.createElement('img');
    bellImage.src = '/assets/images/notifications-empty-bell.png';
    bellImage.alt = 'No notifications';
    bellImage.width = 167;
    bellImage.height = 167;
    bellImage.decoding = 'async';
    bellImage.style.cssText = [
        'width:167px;height:167px;',
        'display:block;',
        'object-fit:contain;',
        'pointer-events:none;',
        'user-select:none;',
    ].join('');
    emptyState.appendChild(bellImage);

    // Text group
    const textGroup = document.createElement('div');
    textGroup.style.cssText = [
        'display:flex;flex-direction:column;',
        'align-items:center;gap:8px;',
        'text-align:center;',
        'width:100%;',
    ].join('');

    const heading = document.createElement('h2');
    heading.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:600;font-size:24px;line-height:36px;',
        'color:#FFFFFF;margin:0;padding:0;',
        'max-width:248px;',
    ].join('');
    heading.textContent = "You're all caught up!";

    const sub = document.createElement('p');
    sub.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:400;font-size:16px;line-height:28px;',
        'color:#353C49;margin:0;padding:0;',
        'max-width:361px;',
    ].join('');
    sub.textContent = "Your notifications will appear here once you've received them.";

    textGroup.appendChild(heading);
    textGroup.appendChild(sub);
    emptyState.appendChild(textGroup);
    container.appendChild(emptyState);
}

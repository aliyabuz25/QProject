/**
 * Favorites screen
 *
 * Favorites are stored in localStorage, keyed per user email.
 * Key format: kidsbible_favorites_<email>
 *
 * Tabs: Audio | Story | Bedtime
 * Navigation: full-screen route (#favorites), back → #profile
 */

import { navigate } from '../js/router.js';
import { loadFavorites, removeFavorite } from '../services/favoritesService.js';
import { state } from '../state/appState.js';
import { optimizeImage } from '../services/imagePerformance.js';

const ACCENT   = '#FEC348';
const INACTIVE = '#9DA3AD';

const TABS = [
    { key: 'audio',   label: 'Audio' },
    { key: 'story',   label: 'Story' },
    { key: 'bedtime', label: 'Bedtime' },
];

export function renderFavorites() {
    let activeTab = TABS.some(tab => tab.key === state.activeFavoritesTab)
        ? state.activeFavoritesTab
        : 'audio';

    // ── Root container ────────────────────────────────────────────────────────
    const container = document.createElement('div');
    container.style.cssText = [
        'position:absolute;inset:0;',
        'background:#0D0D0D;',
        'display:flex;flex-direction:column;',
        'overflow:hidden;',
    ].join('');

    // ── Header ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = [
        'display:flex;flex-direction:row;',
        'align-items:center;',
        'justify-content:space-between;',
        'padding:calc(env(safe-area-inset-top,0px) + 8px) 16px 12px 16px;',
        'flex-shrink:0;',
        'width:100%;',
        'box-sizing:border-box;',
    ].join('');

    const backBtn = document.createElement('button');
    backBtn.style.cssText = [
        'width:44px;height:44px;',
        'border-radius:100px;',
        'background:#292929;',
        'border:none;',
        'display:flex;align-items:center;justify-content:center;',
        'cursor:pointer;flex-shrink:0;padding:0;',
    ].join('');
    backBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    backBtn.addEventListener('click', () => navigate('#profile'));

    const titleEl = document.createElement('h1');
    titleEl.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:600;font-size:24px;line-height:32px;',
        'color:#FFFFFF;margin:0;padding:0;',
        'text-align:center;flex:1;',
    ].join('');
    titleEl.textContent = 'Favorites';

    const spacer = document.createElement('div');
    spacer.style.cssText = 'width:44px;height:44px;flex-shrink:0;';

    header.appendChild(backBtn);
    header.appendChild(titleEl);
    header.appendChild(spacer);
    container.appendChild(header);

    // ── Tab bar ───────────────────────────────────────────────────────────────
    const tabBar = document.createElement('div');
    tabBar.style.cssText = [
        'display:flex;flex-direction:row;',
        'align-items:stretch;',
        'border-bottom:1px solid #1E1E1E;',
        'flex-shrink:0;',
        'padding:0 16px;',
        'gap:0;',
    ].join('');

    const tabEls = {};

    TABS.forEach(({ key, label }) => {
        const tab = document.createElement('button');
        tab.style.cssText = [
            'flex:1;',
            'background:transparent;border:none;',
            'padding:10px 0 8px;',
            'font-family:"Baloo 2",sans-serif;',
            'font-weight:600;font-size:16px;line-height:24px;',
            'cursor:pointer;',
            'border-bottom:2px solid transparent;',
            'transition:color 0.15s,border-color 0.15s;',
            `color:${key === activeTab ? ACCENT : INACTIVE};`,
            `border-bottom-color:${key === activeTab ? ACCENT : 'transparent'};`,
        ].join('');
        tab.textContent = label;
        tab.dataset.tab = key;

        tab.addEventListener('click', () => {
            if (activeTab === key) return;
            activeTab = key;
            state.setActiveFavoritesTab(key);
            Object.entries(tabEls).forEach(([k, el]) => {
                const isActive = k === key;
                el.style.color = isActive ? ACCENT : INACTIVE;
                el.style.borderBottomColor = isActive ? ACCENT : 'transparent';
            });
            renderList(key);
        });

        tabEls[key] = tab;
        tabBar.appendChild(tab);
    });

    container.appendChild(tabBar);

    // ── Scrollable list area ──────────────────────────────────────────────────
    const listArea = document.createElement('div');
    listArea.style.cssText = [
        'flex:1;',
        'overflow-y:auto;',
        '-webkit-overflow-scrolling:touch;',
        'padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 96px) 16px;',
        'display:flex;flex-direction:column;gap:12px;',
        'box-sizing:border-box;',
    ].join('');
    container.appendChild(listArea);

    // ── Render list ───────────────────────────────────────────────────────────
    function renderList(tab) {
        listArea.innerHTML = '';
        const favorites = loadFavorites();
        const items = favorites[tab] || [];

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = [
                'display:flex;flex-direction:column;',
                'align-items:center;justify-content:center;',
                'flex:1;padding:60px 0;gap:12px;',
            ].join('');
            empty.innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                          stroke="${ACCENT}" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
                <p style="font-family:'Baloo 2',sans-serif;font-weight:600;font-size:18px;color:#FFFFFF;margin:0;">No favorites yet</p>
                <p style="font-family:'Baloo 2',sans-serif;font-weight:400;font-size:14px;color:#646464;margin:0;text-align:center;max-width:240px;">
                    Items you favorite will appear here.
                </p>`;
            listArea.appendChild(empty);
            return;
        }

        items.forEach((item) => {
            listArea.appendChild(makeCard(item, tab));
        });
    }

    // ── Card ──────────────────────────────────────────────────────────────────
    function makeCard(item, tab) {
        const card = document.createElement('div');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Open ${item.title || 'favorite'}`);
        card.style.cssText = [
            'display:flex;flex-direction:row;',
            'align-items:center;',
            'gap:16px;',
            'padding:8px 10px 8px 8px;',
            'background:rgba(25,25,25,0.43);',
            'border:1px solid #1B1B1B;',
            'border-radius:12px;',
            'width:100%;box-sizing:border-box;',
            'flex-shrink:0;',
            'cursor:pointer;',
        ].join('');

        function openFavorite() {
            if (tab === 'audio') {
                state.setActiveTrack(item);
                navigate('#player');
                return;
            }

            if (tab === 'shop') {
                state.setActiveProduct(item);
                navigate('#product');
                return;
            }

            const video = {
                ...item,
                verticalBannerUrl: item.verticalBannerUrl || item.image || '',
            };
            state.setActiveVideo(video);
            try { localStorage.setItem('kidsbible_current_video', JSON.stringify(video)); } catch {}
            navigate('#video-player');
        }

        card.addEventListener('click', openFavorite);
        card.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openFavorite();
        });

        // Thumbnail — 56×56, radius:8px
        const thumb = document.createElement('div');
        thumb.style.cssText = [
            'width:56px;height:56px;',
            'border-radius:8px;',
            'overflow:hidden;',
            'flex-shrink:0;',
            'background:#1B1B1B;',
        ].join('');
        const img = document.createElement('img');
        img.src = item.image || '';
        img.alt = item.title || '';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        img.onerror = () => { img.style.display = 'none'; };
        optimizeImage(img);
        thumb.appendChild(img);

        // Text group
        const textGroup = document.createElement('div');
        textGroup.style.cssText = [
            'display:flex;flex-direction:column;',
            'gap:2px;flex:1;min-width:0;',
        ].join('');

        const titleEl = document.createElement('p');
        titleEl.style.cssText = [
            'font-family:"Baloo 2",sans-serif;',
            'font-weight:600;font-size:16px;line-height:24px;',
            'color:#FFFFFF;margin:0;padding:0;',
            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
        ].join('');
        titleEl.textContent = item.title || '';

        const subtitleEl = document.createElement('p');
        subtitleEl.style.cssText = [
            'font-family:"Baloo 2",sans-serif;',
            'font-weight:400;font-size:12px;line-height:16px;',
            'color:#ADB5BD;margin:0;padding:0;',
        ].join('');
        subtitleEl.textContent = item.subtitle || '';

        const timeEl = document.createElement('p');
        timeEl.style.cssText = [
            'font-family:"Baloo 2",sans-serif;',
            'font-weight:400;font-size:14px;line-height:16px;',
            'color:#646464;margin:0;padding:0;',
        ].join('');
        timeEl.textContent = item.duration || item.time || '';

        textGroup.appendChild(titleEl);
        textGroup.appendChild(subtitleEl);
        textGroup.appendChild(timeEl);

        // Remove from favorites button (heart filled → unfavorite)
        const removeBtn = document.createElement('button');
        removeBtn.style.cssText = [
            'width:40px;height:40px;',
            'border-radius:100px;',
            'background:rgba(41,41,41,0.81);',
            'border:none;',
            'display:flex;align-items:center;justify-content:center;',
            'cursor:pointer;flex-shrink:0;padding:0;',
            '-webkit-tap-highlight-color:transparent;',
        ].join('');
        removeBtn.setAttribute('aria-label', 'Remove from favorites');
        removeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="${ACCENT}" stroke="${ACCENT}" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(String(item.id), tab);
            // Animate removal
            card.style.transition = 'opacity 0.2s, transform 0.2s';
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            setTimeout(() => {
                card.remove();
                // If list is now empty, re-render to show empty state
                const favorites = loadFavorites();
                if ((favorites[tab] || []).length === 0) {
                    renderList(tab);
                }
            }, 200);
        });

        card.appendChild(thumb);
        card.appendChild(textGroup);
        card.appendChild(removeBtn);

        return card;
    }

    // Initial render
    renderList(activeTab);

    return container;
}

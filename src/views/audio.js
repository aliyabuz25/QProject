import { musicItemsApi } from '../services/api.js';
import { navigate } from '../js/router.js';
import { state } from '../state/appState.js';
import { optimizeImage } from '../services/imagePerformance.js';

const AUDIO_FILTER_KEY = 'kidsbible_audio_filter';
const AUDIO_SEARCH_ICON = '/assets/images/audio/search-01.svg';
const FALLBACK_AUDIO_FILTERS = [
    { label: 'All', category: null },
    { label: 'Old Testament', category: '__legacy_old_testament__' },
    { label: 'New Testament', category: '__legacy_new_testament__' },
    { label: 'Bedtime Story', category: '__legacy_bedtime_story__' },
];

function getAudioCategory(item) {
    if (typeof item.category === 'string') return item.category;
    return item.category?.title || item.category?.name || item.type || '';
}

function normalizeAudioText(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeAudioLookup(value) {
    return normalizeAudioText(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function isMeaningfulAudioCategory(value) {
    const normalized = normalizeAudioLookup(value);
    return Boolean(normalized && normalized !== 'background' && normalized !== 'bbc');
}

function matchesLegacyAudioFilter(item, filterValue) {
    const lookup = normalizeAudioLookup([
        item.title,
        item.type,
        getAudioCategory(item),
    ].join(' '));

    if (filterValue === '__legacy_old_testament__') {
        return lookup.includes('old testament') || lookup.includes('old audio testament');
    }
    if (filterValue === '__legacy_new_testament__') {
        return lookup.includes('new testament') || lookup.includes('new audio testament');
    }
    if (filterValue === '__legacy_bedtime_story__') {
        return lookup.includes('bedtime');
    }

    return false;
}

/**
 * Audio Library screen — fetches real data from GET /api/music-items
 *
 * Base URL: http://54.196.133.35:3000
 * Endpoint: GET /api/music-items
 * Optional filter: ?type=<type value>
 * Required header: User-Agent: bible-appclient
 *
 * Response shape per item:
 *   { id, title, type, category, categoryId, image, audioUrl, createdAt }
 */
export function renderAudioLibrary() {
    const root = document.createElement('div');
    root.style.cssText = [
        'background:#0D0D0D;',
        'display:flex;',
        'flex-direction:column;',
        'overflow:hidden;',
        'height:100dvh;',
        'width:100%;',
    ].join('');

    const scopedStyles = document.createElement('style');
    scopedStyles.textContent = `
        #audio-search-input::placeholder {
            color: #74797f;
            opacity: 1;
        }

        #audio-search-input::-webkit-search-cancel-button {
            -webkit-appearance: none;
            appearance: none;
        }

        #audio-filter-chips::-webkit-scrollbar {
            display: none;
        }
    `;
    root.appendChild(scopedStyles);

    const header = document.createElement('div');
    header.style.cssText = [
        'flex-shrink:0;',
        'background:#0D0D0D;',
        'width:100%;',
        'box-sizing:border-box;',
        'padding-top:calc(env(safe-area-inset-top,0px) + 18px);',
        'padding-bottom:0;',
        'z-index:10;',
    ].join('');

    const titleRow = document.createElement('div');
    titleRow.style.cssText = [
        'display:flex;',
        'justify-content:center;',
        'align-items:center;',
        'padding:0 16px;',
        'width:100%;',
        'box-sizing:border-box;',
        'margin-bottom:12px;',
    ].join('');

    const title = document.createElement('h1');
    title.style.cssText = [
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:500;',
        'font-size:24px;',
        'line-height:32px;',
        'color:#FFFFFF;',
        'margin:0;',
        'text-align:center;',
    ].join('');
    title.textContent = 'Audio Library';
    titleRow.appendChild(title);
    header.appendChild(titleRow);

    const searchBar = document.createElement('div');
    searchBar.style.cssText = [
        'display:flex;',
        'align-items:center;',
        'gap:8px;',
        'width:calc(100% - 32px);',
        'height:45px;',
        'margin:0 16px 18px;',
        'padding:10px 16px;',
        'box-sizing:border-box;',
        'background:#1B1B1B;',
        'border:1px solid #2A2A2A;',
        'border-radius:32px;',
        'overflow:hidden;',
    ].join('');

    const searchIcon = document.createElement('img');
    searchIcon.src = AUDIO_SEARCH_ICON;
    searchIcon.alt = '';
    searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.style.cssText = [
        'width:20px;',
        'height:20px;',
        'display:block;',
        'flex-shrink:0;',
        'pointer-events:none;',
    ].join('');
    optimizeImage(searchIcon, { eager: true });

    const searchInput = document.createElement('input');
    searchInput.id = 'audio-search-input';
    searchInput.type = 'search';
    searchInput.placeholder = 'Search stories or books';
    searchInput.autocomplete = 'off';
    searchInput.spellcheck = false;
    searchInput.setAttribute('aria-label', 'Search stories or books');
    searchInput.style.cssText = [
        'flex:1 1 auto;',
        'min-width:0;',
        'padding:0;',
        'margin:0;',
        'border:none;',
        'outline:none;',
        'background:transparent;',
        'color:#DEE2E6;',
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:400;',
        'font-size:16px;',
        'line-height:25px;',
        'caret-color:#FEC348;',
    ].join('');

    searchBar.appendChild(searchIcon);
    searchBar.appendChild(searchInput);
    header.appendChild(searchBar);

    const filterRow = document.createElement('div');
    filterRow.id = 'audio-filter-chips';
    filterRow.style.cssText = [
        'display:flex;',
        'align-items:center;',
        'gap:8px;',
        'padding:10px 16px;',
        'overflow-x:auto;',
        'overflow-y:hidden;',
        '-webkit-overflow-scrolling:touch;',
        'scrollbar-width:none;',
        'width:100%;',
        'box-sizing:border-box;',
        'flex-shrink:0;',
        'min-height:56px;',
        '-ms-overflow-style:none;',
    ].join('');
    
    // Skeleton chips
    filterRow.innerHTML = `
        <div class="skeleton w-[60px] h-[36px] rounded-[24px] shrink-0"></div>
        <div class="skeleton w-[110px] h-[36px] rounded-[24px] shrink-0"></div>
        <div class="skeleton w-[120px] h-[36px] rounded-[24px] shrink-0"></div>
        <div class="skeleton w-[90px] h-[36px] rounded-[24px] shrink-0"></div>
    `;
    
    header.appendChild(filterRow);
    root.appendChild(header);

    const scrollArea = document.createElement('div');
    scrollArea.style.cssText = [
        'flex:1;',
        'overflow-y:auto;',
        'overflow-x:hidden;',
        '-webkit-overflow-scrolling:touch;',
        'padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 110px) 16px;',
        'box-sizing:border-box;',
        'display:flex;',
        'flex-direction:column;',
        'gap:16px;',
        'align-items:stretch;',
    ].join('');
    root.appendChild(scrollArea);

    let activeType = null;
    let allItems = [];
    let chipEls = [];
    let searchTerm = '';

    function showLoading() {
        scrollArea.innerHTML = `
            <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px]">
                <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                <div class="flex flex-col gap-[11px] min-w-0 w-[194px] shrink-0">
                    <div class="flex flex-col gap-[6px]">
                        <div class="skeleton w-[140px] h-[20px] rounded"></div>
                        <div class="skeleton w-[100px] h-[16px] rounded-[32px]"></div>
                    </div>
                    <div class="skeleton w-[60px] h-[16px] rounded"></div>
                </div>
                <div class="skeleton w-[40px] h-[40px] rounded-full shrink-0"></div>
            </div>
            <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px]">
                <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                <div class="flex flex-col gap-[11px] min-w-0 w-[194px] shrink-0">
                    <div class="flex flex-col gap-[6px]">
                        <div class="skeleton w-[140px] h-[20px] rounded"></div>
                        <div class="skeleton w-[100px] h-[16px] rounded-[32px]"></div>
                    </div>
                    <div class="skeleton w-[60px] h-[16px] rounded"></div>
                </div>
                <div class="skeleton w-[40px] h-[40px] rounded-full shrink-0"></div>
            </div>
            <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px]">
                <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                <div class="flex flex-col gap-[11px] min-w-0 w-[194px] shrink-0">
                    <div class="flex flex-col gap-[6px]">
                        <div class="skeleton w-[140px] h-[20px] rounded"></div>
                        <div class="skeleton w-[100px] h-[16px] rounded-[32px]"></div>
                    </div>
                    <div class="skeleton w-[60px] h-[16px] rounded"></div>
                </div>
                <div class="skeleton w-[40px] h-[40px] rounded-full shrink-0"></div>
            </div>
            <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px]">
                <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                <div class="flex flex-col gap-[11px] min-w-0 w-[194px] shrink-0">
                    <div class="flex flex-col gap-[6px]">
                        <div class="skeleton w-[140px] h-[20px] rounded"></div>
                        <div class="skeleton w-[100px] h-[16px] rounded-[32px]"></div>
                    </div>
                    <div class="skeleton w-[60px] h-[16px] rounded"></div>
                </div>
                <div class="skeleton w-[40px] h-[40px] rounded-full shrink-0"></div>
            </div>
            <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px]">
                <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                <div class="flex flex-col gap-[11px] min-w-0 w-[194px] shrink-0">
                    <div class="flex flex-col gap-[6px]">
                        <div class="skeleton w-[140px] h-[20px] rounded"></div>
                        <div class="skeleton w-[100px] h-[16px] rounded-[32px]"></div>
                    </div>
                    <div class="skeleton w-[60px] h-[16px] rounded"></div>
                </div>
                <div class="skeleton w-[40px] h-[40px] rounded-full shrink-0"></div>
            </div>
            <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px]">
                <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                <div class="flex flex-col gap-[11px] min-w-0 w-[194px] shrink-0">
                    <div class="flex flex-col gap-[6px]">
                        <div class="skeleton w-[140px] h-[20px] rounded"></div>
                        <div class="skeleton w-[100px] h-[16px] rounded-[32px]"></div>
                    </div>
                    <div class="skeleton w-[60px] h-[16px] rounded"></div>
                </div>
                <div class="skeleton w-[40px] h-[40px] rounded-full shrink-0"></div>
            </div>
        `;
    }

    function showEmpty() {
        scrollArea.innerHTML = '';
        const el = document.createElement('div');
        el.style.cssText = 'color:#555;text-align:center;padding:48px 0;font-family:"Baloo 2",sans-serif;font-size:16px;';
        el.textContent = 'No items found.';
        scrollArea.appendChild(el);
    }

    function itemMatchesSearch(item, query) {
        if (!query) return true;

        const haystack = [
            item.title,
            item.type,
            getAudioCategory(item),
        ]
            .map(normalizeAudioText)
            .filter(Boolean)
            .join(' ');

        return haystack.includes(query);
    }

    function itemMatchesFilter(item, filterValue) {
        if (filterValue === null) return true;
        if (String(filterValue).startsWith('__legacy_')) {
            return matchesLegacyAudioFilter(item, String(filterValue));
        }
        return getAudioCategory(item) === filterValue;
    }

    function getVisibleItems(filterValue = activeType) {
        const normalizedSearch = normalizeAudioText(searchTerm);
        return allItems.filter(item => itemMatchesFilter(item, filterValue) && itemMatchesSearch(item, normalizedSearch));
    }

    function renderItems(items) {
        scrollArea.innerHTML = '';
        if (!items || items.length === 0) {
            showEmpty();
            return;
        }

        items.forEach(item => {
            scrollArea.appendChild(makeAudioCard(item, allItems));
        });
    }

    function buildChips(items) {
        filterRow.innerHTML = '';
        chipEls = [];

        const seen = new Set();
        const categories = [];
        for (const item of items) {
            const category = getAudioCategory(item);
            if (!category || seen.has(category)) continue;
            seen.add(category);
            categories.push(category);
        }

        const meaningfulCategories = categories.filter(isMeaningfulAudioCategory);
        const chips = meaningfulCategories.length >= 3
            ? [
                { label: 'All', category: null },
                ...meaningfulCategories.map(category => ({ label: category, category })),
            ]
            : FALLBACK_AUDIO_FILTERS;

        chips.forEach((chip, idx) => {
            const btn = document.createElement('button');
            btn.dataset.category = chip.category || '';
            btn.style.cssText = [
                'flex-shrink:0;',
                'min-height:36px;',
                'padding:8px 16px;',
                'border-radius:24px;',
                'border:none;',
                'box-sizing:border-box;',
                'display:flex;',
                'align-items:center;',
                'justify-content:center;',
                'cursor:pointer;',
                'font-family:"Baloo 2",sans-serif;',
                'font-weight:400;',
                'font-size:16px;',
                'line-height:20px;',
                'white-space:nowrap;',
                'transition:background 0.15s,color 0.15s;',
                '-webkit-tap-highlight-color:transparent;',
                idx === 0 ? 'background:#FEC348;color:#1B1B1B;' : 'background:#1B1B1B;color:#DEE2E6;',
            ].join('');
            btn.textContent = chip.label;

            btn.addEventListener('click', () => {
                if (activeType === chip.category) return;
                chipEls.forEach(el => {
                    el.style.background = '#1B1B1B';
                    el.style.color = '#DEE2E6';
                });
                btn.style.background = '#FEC348';
                btn.style.color = '#1B1B1B';
                activeType = chip.category;
                renderItems(getVisibleItems(activeType));
            });

            chipEls.push(btn);
            filterRow.appendChild(btn);
        });
    }

    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value || '';
        renderItems(getVisibleItems(activeType));
    });

    async function loadAll() {
        showLoading();
        const items = await musicItemsApi.getMusicItems(null);
        allItems = items || [];
        state.setAudioTracks(allItems);
        buildChips(allItems);

        let requestedCategory = '';
        try {
            requestedCategory = localStorage.getItem(AUDIO_FILTER_KEY) || '';
            localStorage.removeItem(AUDIO_FILTER_KEY);
        } catch {}

        const requestedChip = chipEls.find(btn => btn.dataset.category === requestedCategory);
        if (requestedCategory && requestedChip) requestedChip.click();
        else renderItems(getVisibleItems(null));
    }

    loadAll();

    return root;
}

// Data shape: { id, title, type, category, categoryId, image, audioUrl, createdAt }
function makeAudioCard(item, audioPool = []) {
    const card = document.createElement('div');
    card.style.cssText = [
        'display:flex;flex-direction:row;align-items:center;gap:16px;',
        'padding:8px 10px 8px 8px;',
        'background:rgba(25,25,25,0.43);border:1px solid #1B1B1B;',
        'border-radius:12px;width:100%;box-sizing:border-box;',
        'cursor:pointer;-webkit-tap-highlight-color:transparent;flex-shrink:0;',
    ].join('');

    const thumb = document.createElement('div');
    thumb.style.cssText = [
        'width:80px;height:89px;border-radius:8px;overflow:hidden;',
        'flex-shrink:0;background:#1A1A1A;position:relative;',
    ].join('');

    const img = document.createElement('img');
    img.alt = item.title;
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;';
    img.onerror = () => { img.style.display = 'none'; };
    if (item.image) {
        img.src = item.image;
        img.style.display = 'block';
    }
    optimizeImage(img);
    thumb.appendChild(img);

    const textGroup = document.createElement('div');
    textGroup.style.cssText = 'display:flex;flex-direction:column;justify-content:center;gap:2px;flex:1;min-width:0;';

    const titleEl = document.createElement('h3');
    titleEl.style.cssText = [
        'font-family:"Baloo 2",sans-serif;font-weight:600;font-size:16px;line-height:24px;',
        'color:#FFFFFF;margin:0;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    ].join('');
    titleEl.textContent = item.title;

    const subtitleEl = document.createElement('p');
    subtitleEl.style.cssText = [
        'font-family:"Baloo 2",sans-serif;font-weight:400;font-size:12px;line-height:16px;',
        'color:#ADB5BD;margin:0;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    ].join('');
    subtitleEl.textContent = item.category || item.type || '';

    const timeRow = document.createElement('div');
    timeRow.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:6px;margin-top:4px;';
    timeRow.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
            <circle cx="12" cy="12" r="10" stroke="#646464" stroke-width="1.5"/>
            <path d="M12 6V12L16 16" stroke="#646464" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span style="font-family:'Baloo 2',sans-serif;font-weight:400;font-size:14px;line-height:16px;color:#646464;">Audio</span>
    `;

    textGroup.appendChild(titleEl);
    textGroup.appendChild(subtitleEl);
    textGroup.appendChild(timeRow);

    const btnCol = document.createElement('div');
    btnCol.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-shrink:0;';

    const playBtn = document.createElement('button');
    playBtn.style.cssText = [
        'width:40px;height:40px;border-radius:100%;background:#292929;',
        'border:1px solid #353535;display:flex;align-items:center;justify-content:center;',
        'cursor:pointer;flex-shrink:0;padding:0;-webkit-tap-highlight-color:transparent;',
    ].join('');
    playBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M5.25 20.4852V3.51478C5.25 2.50284 6.38604 1.91617 7.22896 2.49397L19.5938 10.9792C20.2926 11.4586 20.2926 12.5414 19.5938 13.0208L7.22896 21.506C6.38604 22.0838 5.25 21.4972 5.25 20.4852Z" fill="white"/>
    </svg>`;

    function openPlayer() {
        state.setAudioTracks(audioPool);
        state.setActiveTrack(item);
        navigate('#player');
    }

    playBtn.addEventListener('click', event => {
        event.stopPropagation();
        openPlayer();
    });

    btnCol.appendChild(playBtn);

    card.appendChild(thumb);
    card.appendChild(textGroup);
    card.appendChild(btnCol);
    card.addEventListener('click', openPlayer);

    return card;
}

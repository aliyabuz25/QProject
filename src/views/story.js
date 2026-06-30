import { videosApi } from '../services/api.js';
import { navigate } from '../js/router.js';
import { state } from '../state/appState.js';
import { isFavorite, toggleFavorite } from '../services/favoritesService.js';
import { optimizeImage, optimizeImages } from '../services/imagePerformance.js';

const STORY_FILTER_KEY = 'kidsbible_story_filter';
const STORY_SEARCH_ICON = '/assets/images/story/search-01.svg';
const FALLBACK_STORY_FILTERS = [
    { id: 'legacy-old-testament', label: 'Old Testament' },
    { id: 'legacy-new-testament', label: 'New Testament' },
    { id: 'legacy-bedtime', label: 'Bedtime' },
];
const OLD_TESTAMENT_BOOK_NAMES = [
    'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
    'joshua', 'judges', 'ruth', '1 samuel', '2 samuel', '1 kings', '2 kings',
    '1 chronicles', '2 chronicles', 'ezra', 'nehemiah', 'esther', 'job',
    'psalm', 'psalms', 'proverbs', 'ecclesiastes', 'song of solomon',
    'song of songs', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel',
    'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
    'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
];
const NEW_TESTAMENT_BOOK_NAMES = [
    'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1 corinthians',
    '2 corinthians', 'galatians', 'ephesians', 'philippians', 'colossians',
    '1 thessalonians', '2 thessalonians', '1 timothy', '2 timothy', 'titus',
    'philemon', 'hebrews', 'james', '1 peter', '2 peter', '1 john', '2 john',
    '3 john', 'jude', 'revelation',
];

/**
 * Story / Books screen — Figma 1:2516
 *
 * Fetches real videos and categories from:
 *   GET http://54.196.133.35:3000/api/videos
 *   GET http://54.196.133.35:3000/api/categories
 * Header: User-Agent: bible-appclient
 *
 * Video shape: { id, title, slug, categoryId, category, videoUrl, verticalBannerUrl, isLocked, isPublished, orderIndex }
 * Category shape: { id, name, ... }
 */

export function renderStoryDetail() {
    // ── Root container ────────────────────────────────────────────────────────
    const container = document.createElement('div');
    container.style.cssText = [
        'width:100%;',
        'height:100dvh;',
        'overflow:hidden;',
        'background:#0d0d0d;',
        'display:flex;',
        'flex-direction:column;',
        'box-sizing:border-box;',
    ].join('');

    const scopedStyles = document.createElement('style');
    scopedStyles.textContent = `
        #story-search-input::placeholder {
            color: #74797f;
            opacity: 1;
        }

        #story-search-input::-webkit-search-cancel-button {
            -webkit-appearance: none;
            appearance: none;
        }

        #filter-chips::-webkit-scrollbar {
            display: none;
        }
    `;
    container.appendChild(scopedStyles);

    // ── Fixed header ──────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = [
        'width:100%;',
        'flex-shrink:0;',
        'background:#0d0d0d;',
        'padding-top:calc(env(safe-area-inset-top,0px) + 18px);',
        'padding-left:16px;',
        'padding-right:16px;',
        'padding-bottom:16px;',
        'box-sizing:border-box;',
        'z-index:10;',
    ].join('');

    // Title row
    const titleRow = document.createElement('div');
    titleRow.style.cssText = [
        'display:flex;align-items:center;justify-content:center;',
        'width:100%;',
        'margin-bottom:12px;',
    ].join('');
    titleRow.innerHTML = `<h1 style="
        font-family:'Baloo 2',sans-serif;
        font-weight:500;
        font-size:24px;
        line-height:32px;
        margin:0;
        color:#FFFFFF;
        text-align:center;
    ">Story</h1>`;
    header.appendChild(titleRow);

    const searchBar = document.createElement('div');
    searchBar.style.cssText = [
        'display:flex;',
        'align-items:center;',
        'gap:8px;',
        'width:100%;',
        'height:45px;',
        'margin-bottom:28px;',
        'padding:10px 16px;',
        'box-sizing:border-box;',
        'background:#1b1b1b;',
        'border:1px solid #2a2a2a;',
        'border-radius:32px;',
        'overflow:hidden;',
    ].join('');

    const searchIcon = document.createElement('img');
    searchIcon.src = STORY_SEARCH_ICON;
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
    searchInput.id = 'story-search-input';
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
        'color:#dee2e6;',
        'font-family:\'Baloo 2\',sans-serif;',
        'font-weight:400;',
        'font-size:16px;',
        'line-height:25px;',
        'caret-color:#fec348;',
    ].join('');

    searchBar.appendChild(searchIcon);
    searchBar.appendChild(searchInput);
    header.appendChild(searchBar);

    // Filter chips row (populated after categories load)
    const filterRow = document.createElement('div');
    filterRow.id = 'filter-chips';
    filterRow.style.cssText = [
        'display:flex;',
        'flex-direction:row;',
        'align-items:center;',
        'gap:8px;',
        'width:100%;',
        'min-height:36px;',
        'overflow-x:auto;',
        'overflow-y:hidden;',
        '-webkit-overflow-scrolling:touch;',
        'scrollbar-width:none;',
        'box-sizing:border-box;',
    ].join('');
    filterRow.style.msOverflowStyle = 'none';
    
    // Skeleton chips
    filterRow.innerHTML = `
        <div class="skeleton w-[60px] h-[36px] rounded-[24px] shrink-0"></div>
        <div class="skeleton w-[110px] h-[36px] rounded-[24px] shrink-0"></div>
        <div class="skeleton w-[120px] h-[36px] rounded-[24px] shrink-0"></div>
        <div class="skeleton w-[90px] h-[36px] rounded-[24px] shrink-0"></div>
    `;
    
    header.appendChild(filterRow);
    container.appendChild(header);

    // ── Scrollable content area ───────────────────────────────────────────────
    const scrollArea = document.createElement('div');
    scrollArea.style.cssText = [
        'flex:1;',
        'overflow-y:auto;',
        'overflow-x:hidden;',
        '-webkit-overflow-scrolling:touch;',
        'padding:16px 16px calc(110px + env(safe-area-inset-bottom,0px)) 16px;',
        'box-sizing:border-box;',
    ].join('');

    // Story grid
    const grid = document.createElement('div');
    grid.id = 'story-grid';
    grid.style.cssText = [
        'display:grid;',
        'grid-template-columns:repeat(3,1fr);',
        'gap:16px 12px;',
        'width:100%;',
    ].join('');
    
    // Skeleton grid
    grid.innerHTML = `
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
        <div class="skeleton w-full aspect-[2/3] rounded-lg"></div>
    `;
    
    scrollArea.appendChild(grid);
    container.appendChild(scrollArea);

    // ── State ─────────────────────────────────────────────────────────────────
    let allVideos = [];
    let activeFilter = 'all'; // 'all' or a normalized categoryId string
    let categoryLabelsById = new Map();
    let searchTerm = '';

    function getVideoCategoryId(video) {
        const id = video.categoryId ?? video.category?.id;
        return id === null || id === undefined ? '' : String(id);
    }

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function normalizeLookupText(value) {
        return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim();
    }

    function doesVideoMatchSearch(video, query) {
        if (!query) return true;

        const categoryId = getVideoCategoryId(video);
        const embeddedCategory = typeof video.category === 'string'
            ? video.category
            : (video.category?.title || video.category?.name || '');
        const haystack = [
            video.title,
            video.slug,
            categoryLabelsById.get(categoryId),
            embeddedCategory,
        ]
            .map(normalizeText)
            .filter(Boolean)
            .join(' ');

        return haystack.includes(query);
    }

    function getLegacyFilterMatch(video, filterId) {
        const categoryId = getVideoCategoryId(video);
        const embeddedCategory = typeof video.category === 'string'
            ? video.category
            : (video.category?.title || video.category?.name || '');
        const lookup = normalizeLookupText([
            video.title,
            video.slug,
            categoryLabelsById.get(categoryId),
            embeddedCategory,
        ].join(' '));

        if (filterId === 'legacy-bedtime') return lookup.includes('bedtime');
        if (filterId === 'legacy-old-testament') {
            return OLD_TESTAMENT_BOOK_NAMES.some(book => lookup.includes(book));
        }
        if (filterId === 'legacy-new-testament') {
            return NEW_TESTAMENT_BOOK_NAMES.some(book => lookup.includes(book));
        }
        return false;
    }

    // ── Render grid ───────────────────────────────────────────────────────────
    function renderGrid(filter) {
        grid.innerHTML = '';
        const normalizedSearch = normalizeText(searchTerm);
        const videos = allVideos.filter(video => {
            const matchesFilter = filter === 'all'
                ? true
                : String(filter).startsWith('legacy-')
                    ? getLegacyFilterMatch(video, String(filter))
                    : getVideoCategoryId(video) === String(filter);
            return matchesFilter && doesVideoMatchSearch(video, normalizedSearch);
        });

        if (videos.length === 0) {
            grid.innerHTML = `<div style="color:#a7a7a7;text-align:center;grid-column:1/-1;padding:32px 0;">No stories found</div>`;
            return;
        }

        videos.forEach((video) => {
            const card = document.createElement('div');
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Play ${video.title || 'video'}`);
            card.style.cssText = [
                'width:100%;',
                'aspect-ratio:2/3;',
                'position:relative;',
                'border-radius:8px;',
                'border:1px solid #444;',
                'overflow:hidden;',
                'cursor:pointer;',
                'transition:opacity 150ms;',
            ].join('');

            const imgSrc = video.verticalBannerUrl || '';
            card.innerHTML = `
                <img src="${imgSrc}" style="
                    width:100%;height:100%;
                    object-fit:cover;
                    pointer-events:none;
                    display:block;
                " onerror="this.style.background='#1a1a1a'" />
                <div style="
                    position:absolute;inset:0;
                    display:flex;align-items:center;justify-content:center;
                    background:rgba(0,0,0,0.1);
                ">
                    <button style="
                        width:40px;height:39px;
                        border-radius:50%;
                        background:rgba(41,41,41,0.81);
                        display:flex;align-items:center;justify-content:center;
                        border:none;pointer-events:none;
                    ">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M5.25 20.4852V3.51478C5.25 2.50284 6.38604 1.91617 7.22896 2.49397L19.5938 10.9792C20.2926 11.4586 20.2926 12.5414 19.5938 13.0208L7.22896 21.506C6.38604 22.0838 5.25 21.4972 5.25 20.4852Z" fill="white"/>
                        </svg>
                    </button>
                </div>`;

            const categoryId = getVideoCategoryId(video);
            const embeddedCategory = typeof video.category === 'string'
                ? video.category
                : (video.category?.title || video.category?.name || 'Story');
            const categoryLabel = categoryLabelsById.get(categoryId) || embeddedCategory;
            const favoriteType = categoryLabel.toLowerCase().includes('bedtime') ? 'bedtime' : 'story';

            const favoriteButton = document.createElement('button');
            favoriteButton.type = 'button';
            favoriteButton.style.cssText = [
                'position:absolute;top:6px;right:6px;z-index:3;',
                'width:32px;height:32px;border-radius:50%;',
                'border:1px solid rgba(255,255,255,0.12);',
                'background:rgba(13,13,13,0.72);backdrop-filter:blur(6px);',
                'display:flex;align-items:center;justify-content:center;',
                'padding:0;cursor:pointer;',
            ].join('');

            function updateFavoriteButton() {
                const favorite = isFavorite(String(video.id), favoriteType);
                favoriteButton.setAttribute('aria-label', favorite ? 'Remove from favorites' : 'Add to favorites');
                favoriteButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                          ${favorite ? 'fill="#FEC348" stroke="#FEC348"' : 'stroke="#FFFFFF"'} stroke-width="1.5" stroke-linejoin="round"/>
                </svg>`;
            }

            favoriteButton.addEventListener('pointerdown', event => event.stopPropagation());
            favoriteButton.addEventListener('click', event => {
                event.stopPropagation();
                toggleFavorite({
                    ...video,
                    id: String(video.id),
                    type: favoriteType,
                    subtitle: categoryLabel,
                    image: video.verticalBannerUrl || '',
                });
                updateFavoriteButton();
            });
            updateFavoriteButton();
            card.appendChild(favoriteButton);

            function openVideoPlayer() {
                state.setActiveVideo(video);
                try { localStorage.setItem('kidsbible_current_video', JSON.stringify(video)); } catch(e) {}
                navigate('#video-player');
            }

            card.addEventListener('click', openVideoPlayer);
            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openVideoPlayer();
            });
            card.addEventListener('pointerdown', () => { card.style.opacity = '0.75'; });
            card.addEventListener('pointerup',   () => { card.style.opacity = '1'; });
            card.addEventListener('pointerleave',() => { card.style.opacity = '1'; });

            grid.appendChild(card);
        });

        optimizeImages(grid, { eagerCount: 6 });
    }

    // ── Build filter chips ────────────────────────────────────────────────────
    function buildChips(categories) {
        filterRow.innerHTML = '';

        // "All" chip always first
        const allChip = document.createElement('button');
        allChip.dataset.filter = 'all';
        allChip.className = 'chip-btn';
        allChip.textContent = 'All';
        allChip.style.cssText = chipStyle(true);
        filterRow.appendChild(allChip);

        // Only show categories that are used by the loaded videos. This keeps
        // audio/music/empty backend categories out of the Story screen.
        const categoriesById = new Map(
            categories.map(category => [String(category.id), category])
        );
        categoryLabelsById = new Map(
            categories.map(category => [
                String(category.id),
                category.title || category.name || `Category ${category.id}`,
            ])
        );
        const videoCategories = new Map();

        allVideos.forEach(video => {
            const id = getVideoCategoryId(video);
            if (!id || videoCategories.has(id)) return;
            const category = categoriesById.get(id) || video.category || {};
            const embeddedName = typeof video.category === 'string' ? video.category : '';
            const label = category.title || category.name || embeddedName || `Category ${id}`;
            videoCategories.set(id, label);
        });

        videoCategories.forEach((label, id) => {
                const btn = document.createElement('button');
                btn.dataset.filter = id;
                btn.className = 'chip-btn';
                btn.textContent = label;
                btn.style.cssText = chipStyle(false);
                filterRow.appendChild(btn);
        });

        if (videoCategories.size === 0) {
            FALLBACK_STORY_FILTERS.forEach(({ id, label }) => {
                const btn = document.createElement('button');
                btn.dataset.filter = id;
                btn.className = 'chip-btn';
                btn.textContent = label;
                btn.style.cssText = chipStyle(false);
                filterRow.appendChild(btn);
            });
        }

        // Click handler
        filterRow.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-filter]');
            if (!btn) return;
            const raw = btn.dataset.filter;
            activeFilter = raw;

            filterRow.querySelectorAll('.chip-btn').forEach(chip => {
                const isActive = chip.dataset.filter === String(activeFilter) ||
                                 (activeFilter === 'all' && chip.dataset.filter === 'all');
                chip.style.cssText = chipStyle(isActive);
            });

            renderGrid(activeFilter);
        });
    }

    function chipStyle(active) {
        return [
            `background:${active ? '#fec348' : '#1b1b1b'};`,
            `color:${active ? '#1b1b1b' : '#dee2e6'};`,
            'font-family:\'Baloo 2\',sans-serif;',
            'font-weight:400;',
            'font-size:16px;',
            'line-height:20px;',
            'display:flex;',
            'align-items:center;',
            'justify-content:center;',
            'min-height:36px;',
            'padding:8px 16px;',
            'border-radius:24px;',
            'border:none;',
            'box-sizing:border-box;',
            'cursor:pointer;',
            'white-space:nowrap;',
            'flex-shrink:0;',
            'transition:background 200ms,color 200ms;',
            '-webkit-tap-highlight-color:transparent;',
        ].join('');
    }

    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value || '';
        renderGrid(activeFilter);
    });

    // ── Load data ─────────────────────────────────────────────────────────────
    Promise.all([
        videosApi.getVideos(),
        videosApi.getCategories(),
    ]).then(([videos, categories]) => {
        allVideos = videos;

        // Build chips from real categories
        buildChips(categories);

        let requestedFilter = '';
        try {
            requestedFilter = localStorage.getItem(STORY_FILTER_KEY) || '';
            localStorage.removeItem(STORY_FILTER_KEY);
        } catch {}
        const requestedChip = Array.from(filterRow.querySelectorAll('[data-filter]'))
            .find(chip => chip.dataset.filter === requestedFilter);

        if (requestedFilter && requestedChip) requestedChip.click();
        else renderGrid('all');
    }).catch(err => {
        console.error('[STORY] Failed to load:', err);
        grid.innerHTML = `<div style="color:#a7a7a7;text-align:center;grid-column:1/-1;padding:32px 0;">Failed to load stories. Please try again.</div>`;
    });

    return container;
}

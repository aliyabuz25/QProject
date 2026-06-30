/**
 * Search screen — searches real backend data (audio + videos) client-side.
 *
 * On mount: fetches all music items and all videos in parallel, caches them.
 * On each keystroke: filters cached data by title/category match.
 *
 * Audio items: { id, title, type, category, image, audioUrl }
 * Video items: { id, title, slug, category, verticalBannerUrl, videoUrl }
 */

import { navigate } from '../js/router.js';
import { musicItemsApi, videosApi } from '../services/api.js';
import { state } from '../state/appState.js';
import { isFavorite, toggleFavorite } from '../services/favoritesService.js';
import { optimizeImage } from '../services/imagePerformance.js';

const ACCENT = '#FEC348';

export function renderSearch() {
    const container = document.createElement('div');
    container.className = 'screen bg-[#0d0d0d] text-white font-baloo relative';
    container.style.cssText = 'position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;';

    container.innerHTML = `
        <style>
            .search-scroll-container {
                padding-bottom: 80px;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .search-header {
                display: flex;
                align-items: center;
                padding: 71px 16px 10px 16px;
                width: 100%;
                gap: 12px;
                box-sizing: border-box;
            }
            .btn-back {
                width: 44px;
                height: 44px;
                border-radius: 100px;
                background: #292929;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
            }
            .search-input-wrapper {
                flex: 1;
                height: 44px;
                background: #1b1b1b;
                border-radius: 100px;
                display: flex;
                align-items: center;
                padding: 0 16px;
                gap: 10px;
            }
            .search-input-wrapper input {
                flex: 1;
                background: transparent;
                border: none;
                color: white;
                font-family: 'Baloo 2', sans-serif;
                font-size: 16px;
                outline: none;
            }
            .search-input-wrapper input::placeholder {
                color: #6e6e6e;
            }
            .search-results {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 0;
                padding: 0 16px 16px 16px;
                box-sizing: border-box;
            }
            .search-section-title {
                font-family: 'Baloo 2', sans-serif;
                font-weight: 600;
                font-size: 18px;
                color: #FFFFFF;
                margin: 16px 0 8px 0;
                padding: 0;
            }
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 40vh;
                color: #6e6e6e;
                font-family: 'Baloo 2', sans-serif;
                font-size: 18px;
                text-align: center;
                gap: 8px;
            }
            .search-card {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 12px;
                padding: 10px 0;
                border-bottom: 1px solid #1A1A1A;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }
            .search-card:last-child { border-bottom: none; }
            .search-thumb {
                width: 52px;
                height: 52px;
                border-radius: 8px;
                background: #1B1B1B;
                overflow: hidden;
                flex-shrink: 0;
                position: relative;
            }
            .search-thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .search-card-text {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .search-card-title {
                font-family: 'Baloo 2', sans-serif;
                font-weight: 600;
                font-size: 15px;
                line-height: 22px;
                color: #FFFFFF;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin: 0;
            }
            .search-card-sub {
                font-family: 'Baloo 2', sans-serif;
                font-weight: 400;
                font-size: 12px;
                line-height: 16px;
                color: #ADB5BD;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .search-badge {
                font-family: 'Baloo 2', sans-serif;
                font-weight: 600;
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 20px;
                flex-shrink: 0;
            }
            .badge-audio { background: rgba(254,195,72,0.15); color: #FEC348; }
            .badge-video { background: rgba(99,179,237,0.15); color: #63B3ED; }
            .search-card-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            .search-favorite-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid #2A2A2A;
                background: #1A1A1A;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                cursor: pointer;
            }
        </style>

        <div class="search-scroll-container">
            <div class="search-header">
                <button class="btn-back" id="search-back-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <div class="search-input-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#6e6e6e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <input type="text" id="search-input" placeholder="Search stories, audio..." autofocus>
                </div>
            </div>

            <div class="search-results" id="search-results">
                <div class="empty-state" id="initial-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Start typing to search...</span>
                </div>
            </div>
        </div>
    `;

    // Back button
    container.querySelector('#search-back-btn').addEventListener('click', () => {
        navigate('#home');
    });

    const input = container.querySelector('#search-input');
    const resultsEl = container.querySelector('#search-results');

    // ── Data cache ─────────────────────────────────────────────────────────────
    let audioItems = [];
    let videoItems = [];
    let videoCategoryMap = new Map();
    let dataLoaded = false;
    let loadError = false;

    // Fetch both in parallel on mount
    Promise.all([
        musicItemsApi.getMusicItems(null).catch(() => []),
        videosApi.getVideos().catch(() => []),
        videosApi.getCategories().catch(() => []),
    ]).then(([audio, videos, categories]) => {
        audioItems = audio || [];
        videoItems = videos || [];
        videoCategoryMap = new Map((categories || []).map(category => [String(category.id), category]));
        dataLoaded = true;
        // If user already typed something, re-run search
        const q = input.value.trim();
        if (q.length > 0) runSearch(q);
    }).catch(() => {
        loadError = true;
        dataLoaded = true;
    });

    // ── Debounce ───────────────────────────────────────────────────────────────
    let debounceTimer = null;

    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        if (query === '') {
            showInitialState();
            return;
        }

        // Show loading indicator while data is still fetching
        if (!dataLoaded) {
            resultsEl.innerHTML = `
                <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px] mb-4">
                    <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                    <div class="flex flex-col gap-[11px] min-w-0 flex-1">
                        <div class="flex flex-col gap-[6px]">
                            <div class="skeleton w-3/4 h-[20px] rounded"></div>
                            <div class="skeleton w-1/2 h-[16px] rounded-[32px]"></div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px] mb-4">
                    <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                    <div class="flex flex-col gap-[11px] min-w-0 flex-1">
                        <div class="flex flex-col gap-[6px]">
                            <div class="skeleton w-3/4 h-[20px] rounded"></div>
                            <div class="skeleton w-1/2 h-[16px] rounded-[32px]"></div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] gap-[16px] mb-4">
                    <div class="skeleton w-[80px] h-[89px] rounded-[8px] shrink-0"></div>
                    <div class="flex flex-col gap-[11px] min-w-0 flex-1">
                        <div class="flex flex-col gap-[6px]">
                            <div class="skeleton w-3/4 h-[20px] rounded"></div>
                            <div class="skeleton w-1/2 h-[16px] rounded-[32px]"></div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        debounceTimer = setTimeout(() => runSearch(query), 150);
    });

    // ── Search logic ───────────────────────────────────────────────────────────
    function normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase();
    }

    function getAudioCategory(item) {
        if (typeof item.category === 'string') return item.category;
        return item.category?.title || item.category?.name || item.type || 'Audio';
    }

    function getVideoCategory(item) {
        if (typeof item.category === 'string') return item.category;
        const embedded = item.category?.title || item.category?.name;
        if (embedded) return embedded;
        const category = videoCategoryMap.get(String(item.categoryId ?? ''));
        return category?.title || category?.name || 'Story';
    }

    function runSearch(query) {
        const q = normalizeSearchText(query);

        const matchedAudio = audioItems.filter(item => normalizeSearchText([
            item.title,
            item.type,
            getAudioCategory(item),
        ].join(' ')).includes(q));

        const matchedVideos = videoItems.filter(item => normalizeSearchText([
            item.title,
            item.slug,
            getVideoCategory(item),
        ].join(' ')).includes(q));

        if (matchedAudio.length === 0 && matchedVideos.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>No results for "<strong style="color:#fff;">${escHtml(query)}</strong>"</span>
                </div>
            `;
            return;
        }

        resultsEl.innerHTML = '';

        if (matchedAudio.length > 0) {
            const sectionTitle = document.createElement('p');
            sectionTitle.className = 'search-section-title';
            sectionTitle.textContent = `Audio (${matchedAudio.length})`;
            resultsEl.appendChild(sectionTitle);

            const audioList = document.createElement('div');
            matchedAudio.forEach(item => {
                const card = makeCard({
                    title:    item.title,
                    subtitle: getAudioCategory(item),
                    image:    item.image || '',
                    badge:    'audio',
                    favoriteItem: {
                        ...item,
                        id: String(item.id),
                        type: 'audio',
                        subtitle: getAudioCategory(item),
                        image: item.image || '',
                        duration: item.duration || 'Audio',
                    },
                    onClick:  () => {
                        state.setActiveTrack(item);
                        navigate('#player');
                    },
                });
                audioList.appendChild(card);
            });
            resultsEl.appendChild(audioList);
        }

        if (matchedVideos.length > 0) {
            const sectionTitle = document.createElement('p');
            sectionTitle.className = 'search-section-title';
            sectionTitle.textContent = `Stories / Videos (${matchedVideos.length})`;
            resultsEl.appendChild(sectionTitle);

            const videoList = document.createElement('div');
            matchedVideos.forEach(item => {
                const catLabel = getVideoCategory(item);
                const favoriteType = catLabel.toLowerCase().includes('bedtime') ? 'bedtime' : 'story';
                const card = makeCard({
                    title:    item.title,
                    subtitle: catLabel,
                    image:    item.verticalBannerUrl || '',
                    badge:    'video',
                    favoriteItem: {
                        ...item,
                        id: String(item.id),
                        type: favoriteType,
                        subtitle: catLabel,
                        image: item.verticalBannerUrl || '',
                    },
                    onClick:  () => {
                        state.setActiveVideo(item);
                        try { localStorage.setItem('kidsbible_current_video', JSON.stringify(item)); } catch {}
                        navigate('#video-player');
                    },
                });
                videoList.appendChild(card);
            });
            resultsEl.appendChild(videoList);
        }
    }

    function showInitialState() {
        resultsEl.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Start typing to search...</span>
            </div>
        `;
    }

    // ── Card builder ───────────────────────────────────────────────────────────
    function makeCard({ title, subtitle, image, badge, favoriteItem, onClick }) {
        const card = document.createElement('div');
        card.className = 'search-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Open ${title || 'result'}`);

        const thumb = document.createElement('div');
        thumb.className = 'search-thumb';
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = title || '';
            img.onerror = () => { img.style.display = 'none'; };
            optimizeImage(img);
            thumb.appendChild(img);
        }

        const textGroup = document.createElement('div');
        textGroup.className = 'search-card-text';

        const titleEl = document.createElement('p');
        titleEl.className = 'search-card-title';
        titleEl.textContent = title || '';

        const subEl = document.createElement('p');
        subEl.className = 'search-card-sub';
        subEl.textContent = subtitle || '';

        textGroup.appendChild(titleEl);
        textGroup.appendChild(subEl);

        const badgeEl = document.createElement('span');
        badgeEl.className = `search-badge badge-${badge}`;
        badgeEl.textContent = badge === 'audio' ? '♪ Audio' : '▶ Video';

        const actions = document.createElement('div');
        actions.className = 'search-card-actions';

        const favoriteButton = document.createElement('button');
        favoriteButton.type = 'button';
        favoriteButton.className = 'search-favorite-btn';

        function updateFavoriteButton() {
            const favorite = isFavorite(favoriteItem.id, favoriteItem.type);
            favoriteButton.setAttribute('aria-label', favorite ? 'Remove from favorites' : 'Add to favorites');
            favoriteButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      ${favorite ? 'fill="#FEC348" stroke="#FEC348"' : 'stroke="#ADB5BD"'} stroke-width="1.5" stroke-linejoin="round"/>
            </svg>`;
        }

        favoriteButton.addEventListener('click', event => {
            event.stopPropagation();
            toggleFavorite(favoriteItem);
            updateFavoriteButton();
        });
        updateFavoriteButton();

        actions.appendChild(badgeEl);
        actions.appendChild(favoriteButton);

        card.appendChild(thumb);
        card.appendChild(textGroup);
        card.appendChild(actions);

        card.addEventListener('click', onClick);
        card.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onClick();
        });
        return card;
    }

    function escHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return container;
}

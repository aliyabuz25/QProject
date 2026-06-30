import { musicItemsApi, videosApi } from '../services/api.js';
import { state } from '../state/appState.js';
import { navigate } from '../js/router.js';
import { optimizeImages } from '../services/imagePerformance.js';

const STORY_FILTER_KEY = 'kidsbible_story_filter';
const AUDIO_FILTER_KEY = 'kidsbible_audio_filter';

function normalizeLabel(value) {
    return String(value || '').trim().toLowerCase();
}

function getAudioCategory(item) {
    if (!item) return '';
    if (typeof item.category === 'string') return item.category;
    return item.category?.title || item.category?.name || item.type || '';
}

function settledList(result, sourceName) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        return result.value;
    }
    if (result.status === 'rejected') {
        console.warn(`[HOME] ${sourceName} could not be loaded:`, result.reason);
    }
    return [];
}

/**
 * Find a category from the backend categories list by matching title keywords.
 * Returns the category object or undefined.
 */
function findCategory(categories, ...keywords) {
    return categories.find(cat => {
        const title = normalizeLabel(cat.title);
        return keywords.every(kw => title.includes(kw));
    });
}

/**
 * Homepage — pixel-perfect from Figma frame 1:1682 (393×3058)
 * Category totals reflect the content lists fetched and shown by the app.
 * Section lists show all available items when filtered groups are empty.
 */
export async function renderHome() {
    const container = document.createElement('div');
    container.className = 'bg-[#0d0d0d] text-white font-baloo overflow-x-hidden';
    container.style.cssText = 'position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;';

    // ── GHOST LOADING SKELETON ────────────────────────────────────────────────
    container.innerHTML = `
        <div class="px-4 pb-3 flex flex-row items-center justify-between" style="padding-top: calc(env(safe-area-inset-top, 0px) + 12px)">
            <div class="flex flex-row items-center gap-3">
                <div class="skeleton w-[52px] h-[52px] rounded-full"></div>
                <div class="flex flex-col gap-2">
                    <div class="skeleton w-[80px] h-[14px] rounded"></div>
                    <div class="skeleton w-[120px] h-[18px] rounded"></div>
                </div>
            </div>
            <div class="flex flex-row gap-2">
                <div class="skeleton w-[40px] h-[40px] rounded-full"></div>
                <div class="skeleton w-[40px] h-[40px] rounded-full"></div>
            </div>
        </div>
        <div class="px-4 pt-5 pb-4">
            <div class="skeleton w-full h-[250px] rounded-[20px]"></div>
        </div>
        <div class="px-4 mt-4 mb-2 flex justify-between items-center">
            <div class="skeleton w-[140px] h-[28px] rounded"></div>
            <div class="skeleton w-[50px] h-[16px] rounded"></div>
        </div>
        <div class="px-4 flex gap-5 overflow-hidden pb-4">
            <div class="skeleton min-w-[124px] h-[150px] rounded-lg"></div>
            <div class="skeleton min-w-[124px] h-[150px] rounded-lg"></div>
            <div class="skeleton min-w-[124px] h-[150px] rounded-lg"></div>
        </div>
        <div class="px-4 mt-4 mb-2 flex justify-between items-center">
            <div class="skeleton w-[180px] h-[28px] rounded"></div>
        </div>
        <div class="px-4 flex gap-5 overflow-hidden">
            <div class="skeleton min-w-[140px] h-[190px] rounded-[20px]"></div>
            <div class="skeleton min-w-[140px] h-[190px] rounded-[20px]"></div>
            <div class="skeleton min-w-[140px] h-[190px] rounded-[20px]"></div>
        </div>
    `;

    // ── ASYNC DATA FETCH ──────────────────────────────────────────────────────
    Promise.allSettled([
        videosApi.getVideos(),
        videosApi.getCategories(),
        musicItemsApi.getMusicItems(),
    ]).then(([videosResult, categoriesResult, audioResult]) => {
        const videos = settledList(videosResult, 'Videos');
        const videoCategories = settledList(categoriesResult, 'Video categories');
        const audioItems = settledList(audioResult, 'Music');

        // ── Build a map of categoryId → category for fast lookup ──────────────────
        const videoCategoryMap = new Map(
            videoCategories.map(category => [String(category.id), category])
        );

        const getVideoCategory = (video) => {
            if (typeof video.category === 'string') return video.category;
            const embedded = video.category?.title || video.category?.name;
            if (embedded) return embedded;
            const category = videoCategoryMap.get(String(video.categoryId ?? ''));
            return category?.title || category?.name || '';
        };
        const getVideoCategoryId = (video) => video?.categoryId ?? video?.category?.id ?? '';

        // ── Filter videos/audio by category keyword ────────────────────────────────
        const videoGroups = {
            old:     videos.filter(v => normalizeLabel(getVideoCategory(v)).includes('old') && !normalizeLabel(getVideoCategory(v)).includes('audio')),
            new:     videos.filter(v => normalizeLabel(getVideoCategory(v)).includes('new') && !normalizeLabel(getVideoCategory(v)).includes('audio')),
            bedtime: videos.filter(v => normalizeLabel(getVideoCategory(v)).includes('bedtime')),
        };
        const audioGroups = {
            old:       audioItems.filter(item => normalizeLabel(getAudioCategory(item)).includes('old')),
            new:       audioItems.filter(item => normalizeLabel(getAudioCategory(item)).includes('new')),
            christian: audioItems.filter(item => normalizeLabel(getAudioCategory(item)).includes('christian')),
            hebrew:    audioItems.filter(item => normalizeLabel(getAudioCategory(item)).includes('hebrew')),
        };

        // ── Resolve category IDs from the backend categories list ──────────────────
        // This ensures navigation works even when no items are uploaded yet.
        const catOldTestament    = videoCategories.find(c => normalizeLabel(c.title) === 'old testament')
            || videoCategories.find(c => normalizeLabel(c.title).includes('old') && !normalizeLabel(c.title).includes('audio'));
        const catNewTestament    = videoCategories.find(c => normalizeLabel(c.title) === 'new testament');
        const catOldAudio        = videoCategories.find(c => normalizeLabel(c.title).includes('old') && normalizeLabel(c.title).includes('audio'));
        const catNewAudio        = videoCategories.find(c => normalizeLabel(c.title).includes('new') && normalizeLabel(c.title).includes('audio'));
        const catBedtime         = videoCategories.find(c => normalizeLabel(c.title).includes('bedtime'));
        const catChristian       = videoCategories.find(c => normalizeLabel(c.title).includes('christian') || normalizeLabel(c.title).includes('songs') || normalizeLabel(c.title).includes('praise'));
        const catHebrew          = videoCategories.find(c => normalizeLabel(c.title).includes('hebrew'));

        // Sections fall back to the complete media list while test data is not
        // categorized. Their counters must follow that same displayed list.
        function countSubtitle(group, completeList, unit) {
            const displayedItems = group.length > 0 ? group : completeList;
            return `${displayedItems.length} ${unit}`;
        }

        function videoSubtitle(group, unit = 'videos') {
            return countSubtitle(group, videos, unit);
        }
        function audioSubtitle(group, unit = 'audio') {
            return countSubtitle(group, audioItems, unit);
        }

        // ── Filter value for navigation: prefer category ID from backend ───────────
        function videoFilterId(group, cat) {
            if (cat?.id) return String(cat.id);
            const first = group[0];
            if (!first) return '';
            return String(getVideoCategoryId(first));
        }
        function audioFilterVal(group, cat) {
            if (cat?.id) return String(cat.id);
            const first = group[0];
            if (!first) return '';
            return getAudioCategory(first);
        }

        function openCategory(route, filterValue) {
            try {
                if (route === '#story') {
                    if (filterValue) localStorage.setItem(STORY_FILTER_KEY, String(filterValue));
                    else localStorage.removeItem(STORY_FILTER_KEY);
                }
                if (route === '#audio') {
                    if (filterValue) localStorage.setItem(AUDIO_FILTER_KEY, String(filterValue));
                    else localStorage.removeItem(AUDIO_FILTER_KEY);
                }
            } catch {}
            navigate(route);
        }

        container.innerHTML = '';

    // ─── 1. HEADER ────────────────────────────────────────────────────────────
    const avatarSrc = localStorage.getItem('selectedAvatar') || '/assets/images/avatar-memoji.png';

    const header = document.createElement('div');
    header.className = 'flex flex-row items-center justify-between px-4 pb-3';
    header.style.paddingTop = 'calc(env(safe-area-inset-top, 0px) + 12px)';
    header.innerHTML = `
        <div class="flex flex-row items-center gap-3 flex-1 min-w-0">
            <!-- Avatar 52×52 — tap → #profile -->
            <div class="w-[52px] h-[52px] rounded-full overflow-hidden shrink-0 bg-[#292929] cursor-pointer ripple"
                 onclick="window.location.hash='#profile'" role="button" aria-label="Go to Profile">
                <img id="home-avatar-img" src="${avatarSrc}" alt="Avatar"
                     class="w-full h-full object-cover pointer-events-none" />
            </div>
            <div class="flex flex-col gap-0 min-w-0">
                <!-- Baloo 2 Regular 14px/16px white -->
                <span class="font-baloo font-normal text-[14px] leading-[16px] text-white">Welcome back!</span>
                <!-- Baloo 2 Medium 18px/28px #E9ECEF -->
                <span class="font-baloo font-medium text-[18px] leading-[28px] text-[#e9ecef] truncate">${state.user.name}</span>
            </div>
        </div>
        <div class="flex flex-row items-center gap-2 shrink-0">
            <!-- Search 40×40 #292929 -->
            <button onclick="window.location.hash='#search'"
                    class="w-[40px] h-[40px] rounded-full bg-[#292929] flex items-center justify-center border-none ripple shrink-0"
                    aria-label="Search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.134 17 3 13.866 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z"
                          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <!-- Notifications 40×40 #292929 -->
            <button onclick="window.location.hash='#notifications'"
                    class="w-[40px] h-[40px] rounded-full bg-[#292929] flex items-center justify-center border-none ripple shrink-0"
                    aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `;
    container.appendChild(header);

    // ─── 2. HERO BANNER ───────────────────────────────────────────────────────
    const hero = document.createElement('div');
    hero.className = 'px-4 pt-5 pb-4';
    hero.innerHTML = `
        <div style="position:relative; width:100%; border-radius:20px; overflow:hidden; border:1px solid #1A1A1A; height:250px;">
            <img src="/assets/images/hero-banner.png" alt="Bedtime Stories"
                 style="width:100%; height:100%; object-fit:cover; display:block;" />
            <button type="button"
                    onclick="window.location.hash='#story'"
                    style="position:absolute; left:12px; bottom:12px; z-index:10;
                           width:124px; height:40px; border-radius:32px;
                           background:#FEC348; color:#1B1B1B;
                           font-family:'Baloo 2',sans-serif; font-size:16px; font-weight:500;
                           border:none; cursor:pointer;">
                See more
            </button>
        </div>
    `;
    container.appendChild(hero);

    // ─── 3. CATEGORIES ────────────────────────────────────────────────────────
    // Counts use the same fetched lists that populate the home sections.
    const categories = [
        {
            title:    'Old\nTestament',
            subtitle: videoSubtitle(videoGroups.old, 'books'),
            img:      '/assets/images/categories/cat-char-old-testament.png',
            route:    '#story',
            filter:   videoFilterId(videoGroups.old, catOldTestament),
        },
        {
            title:    'New\nTestament',
            subtitle: videoSubtitle(videoGroups.new, 'books'),
            img:      '/assets/images/categories/cat-char-new-testament.png',
            route:    '#story',
            filter:   videoFilterId(videoGroups.new, catNewTestament),
        },
        {
            title:    'Old Audio\nTestament',
            subtitle: audioSubtitle(audioGroups.old, 'stories'),
            img:      '/assets/images/categories/cat-char-old-audio.png',
            route:    '#audio',
            filter:   audioFilterVal(audioGroups.old, catOldAudio),
        },
        {
            title:    'New Audio\nTestament',
            subtitle: audioSubtitle(audioGroups.new, 'stories'),
            img:      '/assets/images/categories/cat-char-new-audio.png',
            route:    '#audio',
            filter:   audioFilterVal(audioGroups.new, catNewAudio),
        },
        {
            title:    'Bedtime\nStories',
            subtitle: videoSubtitle(videoGroups.bedtime, 'stories'),
            img:      '/assets/images/categories/cat-char-bedtime.png',
            route:    '#story',
            filter:   videoFilterId(videoGroups.bedtime, catBedtime),
        },
        {
            title:    'Christian\nBiblical Music',
            subtitle: audioSubtitle(audioGroups.christian, 'tracks'),
            img:      '/assets/images/categories/cat-char-christian.png',
            route:    '#audio',
            filter:   audioFilterVal(audioGroups.christian, catChristian),
        },
        {
            title:    'Hebrew\nBiblical Music',
            subtitle: audioSubtitle(audioGroups.hebrew, 'tracks'),
            img:      '/assets/images/categories/cat-char-hebrew.png',
            route:    '#audio',
            filter:   audioFilterVal(audioGroups.hebrew, catHebrew),
        },
    ];

    const catSection = document.createElement('div');
    catSection.className = 'flex flex-col mt-4';

    const catHeader = document.createElement('div');
    catHeader.className = 'flex flex-row justify-between items-center px-4';
    catHeader.style.marginBottom = '10px';
    catHeader.innerHTML = `
        <h2 class="font-baloo font-semibold text-[28px] leading-[36px] text-white m-0">Categories</h2>
        <button onclick="window.location.hash='#story'"
                class="font-baloo font-normal text-[16px] leading-[24px] text-[#838383] bg-transparent border-none cursor-pointer">
            See all
        </button>
    `;
    catSection.appendChild(catHeader);

    const catScroll = document.createElement('div');
    catScroll.className = 'flex flex-row gap-5 overflow-x-auto px-4 scrollbar-hide snap-x snap-mandatory';

    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'flex flex-col items-center gap-[10px] w-[124px] min-w-[124px] snap-start py-[6px] cursor-pointer ripple rounded-lg';
        item.onclick = () => openCategory(cat.route, cat.filter);
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', cat.title.replace('\n', ' '));

        const titleLines = cat.title.split('\n');
        const titleHTML = titleLines.map(l => `<span class="block">${l}</span>`).join('');

        item.innerHTML = `
            <div class="w-[74px] h-[74px] rounded-full bg-white p-[2px] shrink-0">
                <div class="w-full h-full rounded-full overflow-hidden">
                    <img src="${cat.img}" alt="${cat.title.replace('\n', ' ')}"
                         class="w-full h-full object-cover pointer-events-none" />
                </div>
            </div>
            <div class="flex flex-col items-center text-center">
                <!-- Baloo 2 SemiBold 18px/28px white (Figma Body 1/Semibold) -->
                <div class="font-baloo font-semibold text-[18px] leading-[28px] text-white text-center">${titleHTML}</div>
                <!-- Baloo 2 Medium 16px/24px #646464 (Figma Body 2/Medium) -->
                <span class="font-baloo font-medium text-[16px] leading-[24px] text-[#646464]">${cat.subtitle}</span>
            </div>
        `;
        catScroll.appendChild(item);
    });

    catSection.appendChild(catScroll);
    container.appendChild(catSection);

    // ── Fallback lists: if a filtered group is empty, show all items ───────────
    // This ensures the home screen always shows content even when the DB is
    // still being populated with test data.
    const otBooks = (videoGroups.old.length > 0 ? videoGroups.old : videos).slice(0, 9).map(video => ({
        name: video.title,
        img:  video.verticalBannerUrl,
        video,
    }));
    const otAudioItems = (audioGroups.old.length > 0 ? audioGroups.old : audioItems).slice(0, 3).map(item => ({
        ...item,
        img:      item.image,
        duration: item.duration || 'Audio',
    }));
    const ntBooks = (videoGroups.new.length > 0 ? videoGroups.new : videos).slice(0, 9).map(video => ({
        name: video.title,
        img:  video.verticalBannerUrl,
        video,
    }));
    const ntAudioItems = (audioGroups.new.length > 0 ? audioGroups.new : audioItems).slice(0, 3).map(item => ({
        ...item,
        img:      item.image,
        duration: item.duration || 'Audio',
    }));

    // ─── 4. OLD TESTAMENT STORY CARDS ─────────────────────────────────────────
    container.appendChild(renderStorySection(
        'Old Testament',
        otBooks,
        '#story',
        190,
        20,
        videoFilterId(videoGroups.old, catOldTestament),
    ));

    // ─── 5. AUDIO OLD TESTAMENT ───────────────────────────────────────────────
    container.appendChild(renderBibleGameBanner());

    container.appendChild(renderAudioSection(
        'Audio Old Testament',
        otAudioItems,
        false,
        '#audio',
        audioFilterVal(audioGroups.old, catOldAudio),
    ));

    // ─── 6. NEW TESTAMENT STORY CARDS ─────────────────────────────────────────
    container.appendChild(renderStorySection(
        'New Testament',
        ntBooks,
        '#story',
        190,
        20,
        videoFilterId(videoGroups.new, catNewTestament),
    ));

    // ─── 7. AUDIO NEW TESTAMENT ───────────────────────────────────────────────
    container.appendChild(renderAudioSection(
        'Audio New Testament',
        ntAudioItems,
        true,
        '#audio',
        audioFilterVal(audioGroups.new, catNewAudio),
        { topPadding: 16 },
    ));

    // ─── 8. PROMO BANNER ──────────────────────────────────────────────────────
    const promo = document.createElement('div');
    promo.className = 'px-4 mt-4';
    promo.innerHTML = `
        <div
             style="position:relative; width:100%; height:220.255px; border-radius:22.6px; overflow:hidden;">
            <img src="/assets/images/home/promo-banner.png" alt="Visit Our Store"
                 style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none;" />
            <button type="button"
                    onclick="window.location.href='https://thekidsbiblestories.com/products/';"
                    style="position:absolute; left:17px; bottom:10px; width:124px; height:40px; border:none; border-radius:100px; background:#F5C34D; color:#0D0D0D; cursor:pointer; font-family:'Baloo 2',sans-serif; font-weight:500; font-size:16px; line-height:20px; display:flex; align-items:center; justify-content:center; padding:0; -webkit-appearance:none; appearance:none;">
                See more
            </button>
        </div>
    `;
    container.appendChild(promo);

        optimizeImages(container, {
            eagerSelectors: ['#home-avatar-img', 'img[alt="Kids Bible Stories"]'],
            eagerCount: 4,
        });
    });

    return container;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function renderBibleGameBanner() {
    const section = document.createElement('div');
    section.className = 'px-4 py-4 mt-4';
    section.innerHTML = `
        <div
            style="position:relative; width:100%; height:203px; border-radius:20px; overflow:hidden;">
            <img
                src="/assets/images/home/bible-game-banner.png"
                alt="Bible Game Adventure"
                style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none;" />
            <button
                type="button"
                onclick="event.stopPropagation(); window.location.hash='#game'"
                aria-label="Play Bible Game Adventure"
                style="position:absolute; right:40px; bottom:9px; width:124px; height:40px; padding:12px 16px; border:none; border-radius:32px; background:#BACF36; color:#0D0D0D; box-shadow:0 2px 1px #FFF82C, inset 0 4px 4px 0 #FFF82A; font-family:'Baloo 2',sans-serif; font-size:18px; font-weight:600; line-height:28px; display:flex; align-items:center; justify-content:center; text-align:center; white-space:nowrap; appearance:none; -webkit-appearance:none; cursor:pointer;">
                Play Now
            </button>
        </div>
    `;

    return section;
}

/**
 * Horizontal-scroll story card section.
 */
function renderStorySection(title, books, seeAllRoute = '#story', cardHeight = 190, cardGap = 20, seeAllFilter = '') {
    const section = document.createElement('div');
    section.className = 'flex flex-col gap-5 mt-4';

    const header = document.createElement('div');
    header.className = 'flex flex-row justify-between items-center px-4';
    header.innerHTML = `
        <h2 class="font-baloo font-semibold text-[28px] leading-[36px] text-white m-0">${title}</h2>
        <button
                class="font-baloo font-normal text-[16px] leading-[24px] text-[#838383] bg-transparent border-none cursor-pointer">
            See all
        </button>
    `;
    header.querySelector('button').addEventListener('click', () => {
        try {
            if (seeAllFilter) localStorage.setItem(STORY_FILTER_KEY, String(seeAllFilter));
            else localStorage.removeItem(STORY_FILTER_KEY);
        } catch {}
        navigate(seeAllRoute);
    });
    section.appendChild(header);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'px-4';

    const scroll = document.createElement('div');
    scroll.className = 'flex flex-row overflow-x-auto scrollbar-hide snap-x snap-mandatory';
    scroll.style.gap = `${cardGap}px`;

    if (books.length === 0) {
        scroll.innerHTML = `<p style="color:#646464;font-family:'Baloo 2',sans-serif;font-size:14px;padding:8px 0;">No content yet</p>`;
    } else {
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = `relative w-[127px] min-w-[127px] rounded-[8px] overflow-hidden snap-start border border-[#444444] shrink-0 cursor-pointer`;
            card.style.height = `${cardHeight}px`;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Play ${book.name}`);
            card.onclick = () => {
                const video = book.video || book;
                state.setActiveVideo(video);
                try { localStorage.setItem('kidsbible_current_video', JSON.stringify(video)); } catch {}
                navigate('#video-player');
            };

            card.innerHTML = `
                <img src="${book.img || ''}" alt="${book.name}" class="w-full h-full object-cover pointer-events-none" />
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-[40px] h-[39px] rounded-full flex items-center justify-center"
                         style="background: rgba(41,41,41,0.81);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M5.25 20.485V3.515C5.25 2.503 6.386 1.916 7.229 2.494L19.594 10.979C20.293 11.459 20.293 12.541 19.594 13.021L7.229 21.506C6.386 22.084 5.25 21.497 5.25 20.485Z" fill="white"/>
                        </svg>
                    </div>
                </div>
            `;
            scroll.appendChild(card);
        });
    }

    scrollWrap.appendChild(scroll);
    section.appendChild(scrollWrap);
    return section;
}

/**
 * Vertical audio list section.
 */
function renderAudioSection(title, items, isNew, seeAllRoute = '#audio', seeAllFilter = '', options = {}) {
    const section = document.createElement('div');
    section.className = 'flex flex-col gap-5 mt-4';
    if (options.topPadding) {
        section.style.paddingTop = `${options.topPadding}px`;
    }

    const header = document.createElement('div');
    header.className = 'flex flex-row justify-between items-center px-4';
    header.innerHTML = `
        <h2 class="font-baloo font-semibold text-[28px] leading-[36px] text-white m-0">${title}</h2>
        <button
                class="font-baloo font-normal text-[16px] leading-[24px] text-[#838383] bg-transparent border-none cursor-pointer">
            See all
        </button>
    `;
    header.querySelector('button').addEventListener('click', () => {
        try {
            if (seeAllFilter) localStorage.setItem(AUDIO_FILTER_KEY, String(seeAllFilter));
            else localStorage.removeItem(AUDIO_FILTER_KEY);
        } catch {}
        navigate(seeAllRoute);
    });
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'flex flex-col gap-4 px-4';

    if (items.length === 0) {
        list.innerHTML = `<p style="color:#646464;font-family:'Baloo 2',sans-serif;font-size:14px;padding:8px 0;">No content yet</p>`;
    } else {
        const badgeBg    = isNew ? '#ff7547' : 'rgba(151,71,255,0.9)';
        const badgeLabel = isNew ? 'New Audio Testament' : 'Old Audio Testament';

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'flex flex-row items-center bg-[#121212] border border-[#1b1b1b] rounded-[12px] p-2 pr-[10px] cursor-pointer';
            row.style.gap = '16px';
            const openPlayer = () => {
                state.setActiveTrack(item);
                navigate('#player');
            };
            row.onclick = openPlayer;

            row.innerHTML = `
                <div class="w-[80px] h-[89px] rounded-[8px] overflow-hidden shrink-0 bg-[#1b1b1b]">
                    <img src="${item.img || ''}" alt="${item.title}" class="w-full h-full object-cover pointer-events-none" />
                </div>
                <div class="flex flex-col gap-[11px] min-w-0" style="width:194px; flex-shrink:0;">
                    <div class="flex flex-col gap-[6px]">
                        <h3 class="font-fredoka font-semibold text-[18px] leading-[28px] text-white m-0 truncate">${item.title}</h3>
                        <span class="font-baloo font-medium text-[12px] leading-[16px] text-white rounded-[32px] self-start whitespace-nowrap"
                              style="background: ${badgeBg}; padding: 4px 8px;">${badgeLabel}</span>
                    </div>
                    <div class="flex flex-row items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#6e6e6e" stroke-width="1.5"/>
                            <path d="M12 6V12L16 16" stroke="#6e6e6e" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <span class="font-fredoka font-normal text-[14px] leading-[20px] text-[#6e6e6e]">${item.duration}</span>
                    </div>
                </div>
                <button class="w-[40px] h-[39px] rounded-full bg-[#292929] border border-[#353535] flex items-center justify-center shrink-0 ripple"
                        aria-label="Play ${item.title}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M5.25 20.485V3.515C5.25 2.503 6.386 1.916 7.229 2.494L19.594 10.979C20.293 11.459 20.293 12.541 19.594 13.021L7.229 21.506C6.386 22.084 5.25 21.497 5.25 20.485Z" fill="white"/>
                    </svg>
                </button>
            `;
            row.querySelector('button').addEventListener('click', event => {
                event.stopPropagation();
                openPlayer();
            });
            list.appendChild(row);
        });
    }

    section.appendChild(list);
    return section;
}

import { navigate, registerRouteCleanup } from '../js/router.js';
import { state } from '../state/appState.js';
import { fetchAsBlobUrl, musicItemsApi } from '../services/api.js';
import { isFavorite, toggleFavorite } from '../services/favoritesService.js';

function formatTime(secs) {
    if (!isFinite(secs) || Number.isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function createIconButton({ label, width = 44, height = 44, iconMarkup, transparent = false, background = '#292929' }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.style.cssText = [
        `width:${width}px;`,
        `height:${height}px;`,
        'border:none;',
        transparent ? 'border-radius:0;' : 'border-radius:999px;',
        'display:flex;',
        'align-items:center;',
        'justify-content:center;',
        'padding:0;',
        'cursor:pointer;',
        '-webkit-tap-highlight-color:transparent;',
        transparent ? 'background:transparent;' : `background:${background};`,
        'flex-shrink:0;',
    ].join('');
    button.innerHTML = iconMarkup;
    return button;
}

export function renderPlayer() {
    let currentTrack = state.activeTrack;
    let coverBlobUrl = '';
    let audioBlobUrl = '';
    let loadSeq = 0;
    let shuffleBusy = false;
    let destroyed = false;

    const container = document.createElement('div');
    container.className = 'screen bg-[#0d0d0d] text-white font-baloo flex flex-col w-full overflow-hidden';
    container.style.cssText = [
        'position:absolute;',
        'inset:0;',
        'background:#0D0D0D;',
        'padding-top:env(safe-area-inset-top,0px);',
    ].join('');

    const audio = document.createElement('audio');
    audio.preload = 'none';
    container.appendChild(audio);

    function revokeIfBlob(url) {
        if (url && String(url).startsWith('blob:')) URL.revokeObjectURL(url);
    }

    function releaseMediaUrls() {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        revokeIfBlob(audioBlobUrl);
        revokeIfBlob(coverBlobUrl);
        audioBlobUrl = '';
        coverBlobUrl = '';
    }

    function cleanupMedia() {
        if (destroyed) return;
        destroyed = true;
        loadSeq += 1;
        releaseMediaUrls();
    }

    const content = document.createElement('div');
    content.style.cssText = [
        'flex:1;',
        'display:flex;',
        'flex-direction:column;',
        'padding:0 16px calc(env(safe-area-inset-bottom,0px) + 10px);',
        'box-sizing:border-box;',
        'overflow:hidden;',
    ].join('');
    container.appendChild(content);

    const topBar = document.createElement('div');
    topBar.style.cssText = [
        'width:calc(100% + 32px);',
        'margin:0 -16px;',
        'padding:8px 16px 10px;',
        'box-sizing:border-box;',
        'display:flex;',
        'align-items:center;',
        'gap:10px;',
        'flex-shrink:0;',
    ].join('');

    const backButton = createIconButton({
        label: 'Go back',
        background: '#1A1A1A',
        iconMarkup: `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M13.3333 10H2.22217" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.22217 15L2.22217 10L7.22217 5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
    });
    backButton.addEventListener('click', () => {
        cleanupMedia();
        navigate('#audio');
    });

    const topTitle = document.createElement('h1');
    topTitle.style.cssText = [
        'flex:1;',
        'margin:0;',
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:500;',
        'font-size:24px;',
        'line-height:32px;',
        'color:#FFFFFF;',
        'text-align:center;',
    ].join('');

    const downloadButton = createIconButton({
        label: 'Download audio',
        background: '#1A1A1A',
        iconMarkup: `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <g transform="translate(5.2 0.4)">
                    <path d="M9.60004 9.06671C9.60004 9.06671 6.0649 13.8667 4.79994 13.8667C3.53508 13.8667 0 9.06671 0 9.06671M4.79994 12.80004V0"
                        stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <g transform="translate(0.4 13.4667)">
                    <path d="M0 0C0 0.992 0 1.488 0.109045 1.89493C0.404938 2.99915 1.26749 3.86176 2.37179 4.15765C2.77872 4.26667 3.2747 4.26667 4.26667 4.26667H14.9333C15.9253 4.26667 16.4213 4.26667 16.8283 4.15765C17.9325 3.86176 18.7951 2.99915 19.091 1.89493C19.2 1.488 19.2 0.992 19.2 0"
                        stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            </svg>
        `,
    });
    downloadButton.addEventListener('click', async () => {
        if (!currentTrack?.audioUrl) return;
        try {
            const href = await fetchAsBlobUrl(currentTrack.audioUrl);
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.download = `${(currentTrack.title || 'audio').replace(/[<>:\"/\\\\|?*]+/g, '_')}.mp3`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => revokeIfBlob(href), 1000);
        } catch (error) {
            console.error('[PLAYER] download failed:', error);
        }
    });

    topBar.append(backButton, topTitle, downloadButton);
    content.appendChild(topBar);

    const coverWrap = document.createElement('div');
    coverWrap.style.cssText = [
        'width:100%;',
        'max-width:361px;',
        'align-self:center;',
        'margin-top:29px;',
        'height:min(calc(100dvh - 434px), 418px);',
        'min-height:300px;',
        'border-radius:16px;',
        'overflow:hidden;',
        'background:#1A1A1A;',
        'flex-shrink:0;',
    ].join('');

    const coverImg = document.createElement('img');
    coverImg.style.cssText = [
        'width:100%;',
        'height:100%;',
        'object-fit:cover;',
        'display:none;',
    ].join('');
    coverImg.onerror = () => {
        coverImg.removeAttribute('src');
        coverImg.style.display = 'none';
    };
    coverWrap.appendChild(coverImg);
    content.appendChild(coverWrap);

    const infoWrap = document.createElement('div');
    infoWrap.style.cssText = [
        'width:100%;',
        'max-width:361px;',
        'align-self:center;',
        'display:flex;',
        'flex-direction:column;',
        'gap:24px;',
        'margin-top:37px;',
        'flex-shrink:0;',
    ].join('');

    const titleRow = document.createElement('div');
    titleRow.style.cssText = [
        'width:100%;',
        'display:flex;',
        'align-items:center;',
        'justify-content:space-between;',
    ].join('');

    const title = document.createElement('h2');
    title.style.cssText = [
        'margin:0;',
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:600;',
        'font-size:28px;',
        'line-height:36px;',
        'color:#FFFFFF;',
    ].join('');

    const favoriteButton = createIconButton({
        label: 'Add to favorites',
        background: '#292929',
        iconMarkup: `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7.00892 13.7231C4.65785 11.9649 0 7.94568 0 4.32871C0 1.93802 1.75438 0 4.16667 0C5.41667 0 6.66667 0.416666 8.33333 2.08333C10 0.416666 11.25 0 12.5 0C14.9122 0 16.6667 1.93802 16.6667 4.32871C16.6667 7.94568 12.0088 11.9649 9.65775 13.7231C8.86658 14.3147 7.80008 14.3147 7.00892 13.7231Z"
                    transform="translate(1.6667 2.9167)"
                    stroke="#FFFFFF" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
    });

    function renderFavoriteButton() {
        const active = currentTrack ? isFavorite(String(currentTrack.id), 'audio') : false;
        favoriteButton.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites');
        favoriteButton.innerHTML = active
            ? `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M7.00892 13.7231C4.65785 11.9649 0 7.94568 0 4.32871C0 1.93802 1.75438 0 4.16667 0C5.41667 0 6.66667 0.416666 8.33333 2.08333C10 0.416666 11.25 0 12.5 0C14.9122 0 16.6667 1.93802 16.6667 4.32871C16.6667 7.94568 12.0088 11.9649 9.65775 13.7231C8.86658 14.3147 7.80008 14.3147 7.00892 13.7231Z"
                        transform="translate(1.6667 2.9167)"
                        fill="#FEC348" stroke="#FEC348" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `
            : `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M7.00892 13.7231C4.65785 11.9649 0 7.94568 0 4.32871C0 1.93802 1.75438 0 4.16667 0C5.41667 0 6.66667 0.416666 8.33333 2.08333C10 0.416666 11.25 0 12.5 0C14.9122 0 16.6667 1.93802 16.6667 4.32871C16.6667 7.94568 12.0088 11.9649 9.65775 13.7231C8.86658 14.3147 7.80008 14.3147 7.00892 13.7231Z"
                        transform="translate(1.6667 2.9167)"
                        stroke="#FFFFFF" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
    }

    favoriteButton.addEventListener('click', () => {
        if (!currentTrack) return;
        toggleFavorite({
            id: String(currentTrack.id),
            type: 'audio',
            title: currentTrack.title,
            subtitle: currentTrack.category || currentTrack.type || 'Audio',
            image: currentTrack.image || '',
            audioUrl: currentTrack.audioUrl || '',
            duration: 'Audio',
        });
        renderFavoriteButton();
    });

    titleRow.append(title, favoriteButton);
    infoWrap.appendChild(titleRow);

    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = 'display:flex;flex-direction:column;gap:11px;width:100%;';

    const progressTrack = document.createElement('button');
    progressTrack.type = 'button';
    progressTrack.setAttribute('aria-label', 'Seek audio');
    progressTrack.style.cssText = [
        'width:100%;',
        'height:4px;',
        'padding:0;',
        'border:none;',
        'border-radius:8px;',
        'background:#74797F;',
        'position:relative;',
        'cursor:pointer;',
        '-webkit-tap-highlight-color:transparent;',
    ].join('');

    const progressFill = document.createElement('span');
    progressFill.style.cssText = [
        'position:absolute;',
        'left:0;',
        'top:0;',
        'height:100%;',
        'width:0%;',
        'border-radius:8px;',
        'background:#FAFAFA;',
        'display:block;',
    ].join('');
    progressTrack.appendChild(progressFill);
    progressTrack.addEventListener('click', event => {
        if (!audio.duration) return;
        const rect = progressTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * audio.duration;
    });
    progressWrap.appendChild(progressTrack);

    const timeRow = document.createElement('div');
    timeRow.style.cssText = [
        'display:flex;',
        'justify-content:space-between;',
        'align-items:center;',
        'font-family:"Baloo 2",sans-serif;',
        'font-weight:400;',
        'font-size:16px;',
        'line-height:24px;',
        'color:#FFFFFF;',
    ].join('');

    const currentTime = document.createElement('span');
    currentTime.textContent = '0:00';
    const totalTime = document.createElement('span');
    totalTime.textContent = '0:00';
    timeRow.append(currentTime, totalTime);
    progressWrap.appendChild(timeRow);
    infoWrap.appendChild(progressWrap);
    content.appendChild(infoWrap);

    const controls = document.createElement('div');
    controls.style.cssText = [
        'width:100%;',
        'max-width:362px;',
        'align-self:center;',
        'display:flex;',
        'align-items:center;',
        'justify-content:space-between;',
        'margin-top:18px;',
        'flex-shrink:0;',
    ].join('');

    const shuffleButton = createIconButton({
        label: 'Random audio',
        width: 26,
        height: 24,
        transparent: true,
        iconMarkup: `
            <svg width="26" height="24" viewBox="0 0 26 24" fill="none" aria-hidden="true">
                <path d="M0 0L5.4167 0L5.4167 5" transform="translate(17.3333 3)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M0 17L18.4167 0" transform="translate(4.3333 3)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5.4167 0L5.4167 5L0 5" transform="translate(17.3333 16)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M0 0L6.5 6" transform="translate(16.25 15)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M0 0L5.4167 5" transform="translate(4.3333 4)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
    });

    const centerControls = document.createElement('div');
    centerControls.style.cssText = 'display:flex;align-items:center;gap:24px;';

    const prevButton = createIconButton({
        label: 'Previous',
        transparent: true,
        iconMarkup: `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 5V19" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
                <path d="M18 6L10 12L18 18V6Z" fill="#FFFFFF"/>
            </svg>
        `,
    });

    const playPauseButton = createIconButton({
        label: 'Play',
        width: 64,
        height: 64,
        iconMarkup: `
            <svg id="player-play-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 5.75L18 12L7 18.25V5.75Z" fill="#FFFFFF"/>
            </svg>
            <svg id="player-pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display:none;">
                <rect x="6" y="5" width="4" height="14" rx="1" fill="#FFFFFF"/>
                <rect x="14" y="5" width="4" height="14" rx="1" fill="#FFFFFF"/>
            </svg>
        `,
    });
    playPauseButton.style.background = '#FEC348';

    const nextButton = createIconButton({
        label: 'Next',
        transparent: true,
        iconMarkup: `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17 5V19" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
                <path d="M6 6L14 12L6 18V6Z" fill="#FFFFFF"/>
            </svg>
        `,
    });

    centerControls.append(prevButton, playPauseButton, nextButton);

    const repeatButton = createIconButton({
        label: 'Repeat',
        width: 24,
        height: 24,
        transparent: true,
        iconMarkup: `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17 2L21 6L17 10" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 11V9C3 7.34315 4.34315 6 6 6H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 22L3 18L7 14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 13V15C21 16.6569 19.6569 18 18 18H3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
    });
    repeatButton.style.opacity = '0.72';

    controls.append(shuffleButton, centerControls, repeatButton);
    content.appendChild(controls);

    const playIcon = playPauseButton.querySelector('#player-play-icon');
    const pauseIcon = playPauseButton.querySelector('#player-pause-icon');

    function setPlaying(isPlaying) {
        playIcon.style.display = isPlaying ? 'none' : 'block';
        pauseIcon.style.display = isPlaying ? 'block' : 'none';
        playPauseButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    }

    async function getRandomAudioPool() {
        const storedPool = Array.isArray(state.audioTracks) ? state.audioTracks.filter(item => item?.audioUrl) : [];
        if (storedPool.length > 1) return storedPool;

        const fetchedPool = await musicItemsApi.getMusicItems(null);
        if (Array.isArray(fetchedPool) && fetchedPool.length > 0) {
            state.setAudioTracks(fetchedPool);
            return fetchedPool.filter(item => item?.audioUrl);
        }

        return storedPool;
    }

    function resetProgressUi() {
        progressFill.style.width = '0%';
        currentTime.textContent = '0:00';
        totalTime.textContent = '0:00';
    }

    async function loadTrack(nextTrack, { autoplay = false } = {}) {
        if (destroyed || !nextTrack) return;

        const seq = ++loadSeq;
        currentTrack = nextTrack;
        state.setActiveTrack(nextTrack);

        releaseMediaUrls();
        audio.removeAttribute('src');
        audio.load();
        coverImg.removeAttribute('src');
        coverImg.style.display = 'none';
        coverImg.alt = nextTrack.title || 'Audio';
        topTitle.textContent = nextTrack.title || 'Unknown';
        title.textContent = nextTrack.title || 'Unknown';
        renderFavoriteButton();
        resetProgressUi();
        setPlaying(false);

        if (nextTrack.image) {
            fetchAsBlobUrl(nextTrack.image)
                .then(blobUrl => {
                    if (destroyed || seq !== loadSeq) {
                        revokeIfBlob(blobUrl);
                        return;
                    }
                    coverBlobUrl = blobUrl;
                    coverImg.src = blobUrl;
                    coverImg.style.display = 'block';
                })
                .catch(() => {});
        }

        if (!nextTrack.audioUrl) return;

        fetchAsBlobUrl(nextTrack.audioUrl)
            .then(blobUrl => {
                if (destroyed || seq !== loadSeq) {
                    revokeIfBlob(blobUrl);
                    return;
                }
                audioBlobUrl = blobUrl;
                audio.src = blobUrl;
                audio.load();
                if (autoplay) {
                    const onCanPlay = () => {
                        if (destroyed || seq !== loadSeq) return;
                        audio.play().catch(error => console.error('[PLAYER] autoplay error:', error));
                    };
                    audio.addEventListener('canplay', onCanPlay, { once: true });
                }
            })
            .catch(error => {
                console.error('[PLAYER] Failed to load audio blob:', error);
            });
    }

    playPauseButton.addEventListener('click', () => {
        if (!audio.src) return;
        if (audio.paused) {
            audio.play().catch(error => console.error('[PLAYER] play error:', error));
        } else {
            audio.pause();
        }
    });

    prevButton.addEventListener('click', () => {
        audio.currentTime = 0;
    });

    nextButton.addEventListener('click', () => {
        if (!audio.duration) return;
        audio.currentTime = audio.duration;
    });

    shuffleButton.addEventListener('click', async () => {
        if (shuffleBusy) return;
        shuffleBusy = true;
        shuffleButton.style.opacity = '0.6';
        try {
            const pool = await getRandomAudioPool();
            const choices = pool.filter(item => String(item.id) !== String(currentTrack?.id));
            const randomTrack = choices[Math.floor(Math.random() * choices.length)] || pool[0] || null;
            if (randomTrack) await loadTrack(randomTrack, { autoplay: true });
        } finally {
            shuffleBusy = false;
            shuffleButton.style.opacity = '1';
        }
    });

    repeatButton.addEventListener('click', () => {
        audio.loop = !audio.loop;
        repeatButton.style.opacity = audio.loop ? '1' : '0.72';
    });

    audio.addEventListener('loadedmetadata', () => {
        totalTime.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        currentTime.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => {
        setPlaying(false);
        resetProgressUi();
        audio.currentTime = 0;
    });

    registerRouteCleanup(cleanupMedia);
    loadTrack(currentTrack);

    return container;
}

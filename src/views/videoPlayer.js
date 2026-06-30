import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { navigate, registerRouteCleanup } from '../js/router.js';
import { state } from '../state/appState.js';
import { normalizeVideoCaptions } from '../services/api.js';
import { isFavorite, toggleFavorite } from '../services/favoritesService.js';

const CURRENT_VIDEO_KEY = 'kidsbible_current_video';
const PLYR_ICON_URL = new URL('../../node_modules/plyr/dist/plyr.svg', import.meta.url).href;
const CAPTION_FETCH_TIMEOUT_MS = 12000;
const CAPTION_PROXY_PREFIX = '/caption-media';
const CAPTION_CDN_ORIGIN = 'https://biblecms-media-2026-app.s3.us-east-1.amazonaws.com';

function getSelectedVideo() {
    if (state.activeVideo) return state.activeVideo;

    try {
        const stored = localStorage.getItem(CURRENT_VIDEO_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function getConnection() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function getPlaybackPolicy() {
    // Return extremely low buffer requirements to let the native browser player 
    // handle buffering, which is usually much faster and avoids artificial delays.
    return { initialBuffer: 0.1, resumeBuffer: 0.1, retryDelay: 2000, maxStartupWait: 500 };
}

function getBufferedAhead(media) {
    const currentTime = Number.isFinite(media.currentTime) ? media.currentTime : 0;
    for (let index = 0; index < media.buffered.length; index += 1) {
        if (media.buffered.start(index) <= currentTime + 0.1
            && media.buffered.end(index) >= currentTime) {
            return Math.max(0, media.buffered.end(index) - currentTime);
        }
    }
    return 0;
}

function hasEnoughBuffer(media, minimumSeconds) {
    const readyState = Number(media?.readyState || 0);
    const futureData = typeof HTMLMediaElement !== 'undefined'
        ? HTMLMediaElement.HAVE_FUTURE_DATA
        : 3;

    return readyState >= futureData || getBufferedAhead(media) >= minimumSeconds;
}

function srtToWebVtt(source) {
    const normalized = String(source || '')
        .replace(/^\uFEFF/, '')
        .replace(/\r\n?/g, '\n')
        .trim();

    if (/^WEBVTT(?:\s|$)/i.test(normalized)) return `${normalized}\n`;

    const body = normalized
        .replace(
            /(\d{1,2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}),(\d{3})/g,
            '$1.$2 --> $3.$4',
        )
        .replace(/\{\\an\d\}/g, '');

    return `WEBVTT\n\n${body}\n`;
}

async function fetchCaptionText(url) {
    const requestUrl = (() => {
        try {
            const absolute = new URL(url, CAPTION_CDN_ORIGIN);
            if (import.meta.env.DEV && absolute.origin === CAPTION_CDN_ORIGIN) {
                return `${CAPTION_PROXY_PREFIX}${absolute.pathname}${absolute.search}`;
            }
            return absolute.toString();
        } catch {
            return url;
        }
    })();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CAPTION_FETCH_TIMEOUT_MS);

    try {
        const headers = { 'Accept': 'text/vtt, application/x-subrip, text/plain;q=0.9, */*;q=0.8' };

        if (Capacitor.isNativePlatform()) {
            const response = await CapacitorHttp.get({
                url,
                responseType: 'text',
                headers,
            });
            if (response.status && response.status >= 400) {
                throw new Error(`HTTP ${response.status}`);
            }
            return typeof response.data === 'string'
                ? response.data
                : String(response.data ?? '');
        }

        const response = await fetch(requestUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } finally {
        clearTimeout(timer);
    }
}

async function prepareCaptionTrack(caption, index, blobUrls, forceDefault = false) {
    try {
        let text = caption.content || await fetchCaptionText(caption.url);
        const isSrt = caption.format === 'srt' || !/^\s*WEBVTT(?:\s|$)/i.test(text);
        if (isSrt) text = srtToWebVtt(text);

        const src = URL.createObjectURL(new Blob([text], { type: 'text/vtt;charset=utf-8' }));
        blobUrls.push(src);

        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = caption.label || `Captions ${index + 1}`;
        track.srclang = caption.language || 'en';
        track.src = src;
        track.default = Boolean(caption.default || forceDefault);
        return track;
    } catch (error) {
        console.warn('[VIDEO] Caption could not be loaded:', caption.url || caption.label, error);
        return null;
    }
}

async function addCaptionTracks(media, video, blobUrls) {
    const captions = normalizeVideoCaptions(video);
    if (!captions.length) return 0;
    const hasExplicitDefault = captions.some(caption => caption.default);

    const tracks = await Promise.all(
        captions.map((caption, index) => (
            prepareCaptionTrack(caption, index, blobUrls, !hasExplicitDefault && index === 0)
        )),
    );
    const appendedTracks = tracks.filter(Boolean);
    appendedTracks.forEach(track => media.appendChild(track));

    const targetTrackIndex = Math.max(0, appendedTracks.findIndex(track => track.default));
    requestAnimationFrame(() => {
        try {
            Array.from(media.textTracks || []).forEach((track, index) => {
                track.mode = index === targetTrackIndex ? 'showing' : 'disabled';
            });
        } catch (error) {
            console.warn('[VIDEO] Caption track activation failed:', error);
        }
    });

    return appendedTracks.length;
}

export function renderVideoPlayer() {
    const selectedVideo = getSelectedVideo();
    const container = document.createElement('section');
    container.className = 'video-player-screen';

    const backButton = document.createElement('button');
    backButton.className = 'video-player-back ripple';
    backButton.setAttribute('aria-label', 'Back to stories');
    backButton.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    container.appendChild(backButton);

    if (selectedVideo?.id !== null && selectedVideo?.id !== undefined) {
        const categoryLabel = typeof selectedVideo.category === 'string'
            ? selectedVideo.category
            : (selectedVideo.category?.title || selectedVideo.category?.name || selectedVideo.subtitle || 'Story');
        const favoriteType = categoryLabel.toLowerCase().includes('bedtime') ? 'bedtime' : 'story';
        const favoriteButton = document.createElement('button');
        favoriteButton.type = 'button';
        favoriteButton.className = 'ripple';
        favoriteButton.style.cssText = [
            'position:absolute;right:16px;top:calc(env(safe-area-inset-top,0px) + 16px);z-index:20;',
            'width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);',
            'background:rgba(13,13,13,0.72);display:flex;align-items:center;justify-content:center;',
            'padding:0;cursor:pointer;',
        ].join('');

        const updateFavoriteButton = () => {
            const favorite = isFavorite(String(selectedVideo.id), favoriteType);
            favoriteButton.setAttribute('aria-label', favorite ? 'Remove from favorites' : 'Add to favorites');
            favoriteButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      ${favorite ? 'fill="#FEC348" stroke="#FEC348"' : 'stroke="#FFFFFF"'} stroke-width="1.5" stroke-linejoin="round"/>
            </svg>`;
        };

        favoriteButton.addEventListener('click', () => {
            toggleFavorite({
                ...selectedVideo,
                id: String(selectedVideo.id),
                type: favoriteType,
                subtitle: categoryLabel,
                image: selectedVideo.verticalBannerUrl || selectedVideo.image || '',
            });
            updateFavoriteButton();
        });
        updateFavoriteButton();
        container.appendChild(favoriteButton);
    }

    let player = null;
    let mediaEl = null;
    let stallTimer = null;
    let startupTimer = null;
    let recoveryTimer = null;
    let destroyed = false;
    let removeExternalListeners = () => {};
    const captionBlobUrls = [];

    function clearTimer(timer) {
        if (timer) clearTimeout(timer);
        return null;
    }

    function clearPlaybackTimers() {
        stallTimer = clearTimer(stallTimer);
        startupTimer = clearTimer(startupTimer);
        recoveryTimer = clearTimer(recoveryTimer);
    }

    function cleanup() {
        if (destroyed) return;
        destroyed = true;
        clearPlaybackTimers();
        removeExternalListeners();
        removeExternalListeners = () => {};
        captionBlobUrls.forEach(url => URL.revokeObjectURL(url));
        if (mediaEl) {
            try {
                mediaEl.pause();
                mediaEl.removeAttribute('src');
                mediaEl.load();
            } catch {}
            mediaEl = null;
        }
        if (player) {
            player.pause();
            player.destroy();
            player = null;
        }
    }

    if (!selectedVideo || !selectedVideo.videoUrl) {
        const emptyState = document.createElement('div');
        emptyState.className = 'video-player-empty';
        emptyState.innerHTML = `
            <p>No video selected</p>
            <span>Choose a story video to start watching.</span>
        `;
        container.appendChild(emptyState);
    } else {
        const playerShell = document.createElement('div');
        playerShell.className = 'video-player-shell';

        const media = document.createElement('video');
        mediaEl = media;
        media.id = 'story-video-player';
        media.autoplay = false;
        media.playsInline = true;
        media.preload = 'auto';
        media.setAttribute('playsinline', '');
        media.setAttribute('webkit-playsinline', '');
        media.src = selectedVideo.videoUrl;
        if (selectedVideo.verticalBannerUrl) media.poster = selectedVideo.verticalBannerUrl;
        media.setAttribute('aria-label', selectedVideo.title || 'Story video');
        playerShell.appendChild(media);

        const title = document.createElement('div');
        title.className = 'video-player-title';
        title.textContent = selectedVideo.title || 'Story video';
        playerShell.appendChild(title);

        const bufferState = document.createElement('div');
        bufferState.className = 'video-buffer-state is-visible';
        bufferState.innerHTML = `
            <span class="video-buffer-spinner" aria-hidden="true"></span>
            <span class="video-buffer-message">Preparing video...</span>
            <button type="button" class="video-retry-button">Try again</button>
        `;
        playerShell.appendChild(bufferState);
        container.appendChild(playerShell);

        const bufferMessage = bufferState.querySelector('.video-buffer-message');
        const retryButton = bufferState.querySelector('.video-retry-button');
        let policy = getPlaybackPolicy();
        let hasStarted = false;

        function showBuffering(message = 'Loading video...', allowRetry = false) {
            bufferMessage.textContent = message;
            retryButton.classList.toggle('is-visible', allowRetry);
            bufferState.classList.add('is-visible');
        }

        function hideBuffering() {
            stallTimer = clearTimer(stallTimer);
            bufferState.classList.remove('is-visible');
            retryButton.classList.remove('is-visible');
        }

        function tryStartPlayback(force = false) {
            if (destroyed || hasStarted || !player) return;
            const enoughBuffered = hasEnoughBuffer(media, policy.initialBuffer);
            if (!force && !enoughBuffered) return;

            hasStarted = true;
            startupTimer = clearTimer(startupTimer);
            player.play().catch(() => {
                hideBuffering();
            });
        }

        function monitorRecovery() {
            recoveryTimer = clearTimer(recoveryTimer);
            if (destroyed || !hasStarted || !player) return;

            const enoughBuffered = hasEnoughBuffer(media, policy.resumeBuffer);
            if (enoughBuffered) {
                player.play().catch(() => showBuffering('Tap play to continue.', true));
                return;
            }
            recoveryTimer = setTimeout(monitorRecovery, 500);
        }

        function scheduleRecovery() {
            stallTimer = clearTimer(stallTimer);
            stallTimer = setTimeout(() => {
                showBuffering('The connection is slow.', true);
            }, policy.retryDelay);
            monitorRecovery();
        }

        function retryPlayback(forceReload = false) {
            clearPlaybackTimers();
            const resumeAt = Number.isFinite(media.currentTime) ? media.currentTime : 0;
            showBuffering('Reconnecting...', false);

            if (!forceReload) {
                monitorRecovery();
                player?.play().catch(() => {});
                return;
            }

            media.load();

            media.addEventListener('loadedmetadata', () => {
                if (resumeAt > 0 && Number.isFinite(media.duration)) {
                    media.currentTime = Math.min(resumeAt, Math.max(0, media.duration - 0.1));
                }
                hasStarted = true;
                monitorRecovery();
            }, { once: true });
        }

        const handleConnectionChange = () => {
            policy = getPlaybackPolicy();
            if (!hasStarted) tryStartPlayback();
        };
        const handleOnline = () => {
            if (media.error || media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) retryPlayback(true);
            else monitorRecovery();
        };
        const handleOffline = () => showBuffering('No internet connection.', true);
        const connection = getConnection();
        connection?.addEventListener?.('change', handleConnectionChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        removeExternalListeners = () => {
            connection?.removeEventListener?.('change', handleConnectionChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };

        retryButton.addEventListener('click', (event) => {
            event.stopPropagation();
            retryPlayback(Boolean(media.error || media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE));
        });

        media.addEventListener('loadstart', () => {
            if (!hasStarted) showBuffering('Preparing video...');
        });
        media.addEventListener('loadedmetadata', () => tryStartPlayback());
        media.addEventListener('progress', () => tryStartPlayback());
        media.addEventListener('loadeddata', () => tryStartPlayback());
        media.addEventListener('canplay', () => tryStartPlayback());
        media.addEventListener('canplaythrough', () => tryStartPlayback());
        media.addEventListener('waiting', () => {
            if (!hasStarted) return;
            showBuffering('Buffering...');
            scheduleRecovery();
        });
        media.addEventListener('stalled', () => {
            showBuffering('Buffering...');
            scheduleRecovery();
        });
        media.addEventListener('playing', () => {
            recoveryTimer = clearTimer(recoveryTimer);
            hideBuffering();
        });
        media.addEventListener('error', () => {
            clearPlaybackTimers();
            showBuffering('Video could not be loaded.', true);
        });

        player = new Plyr(media, {
            title: selectedVideo.title || 'Story video',
            autoplay: false,
            autopause: true,
            playsinline: true,
            clickToPlay: true,
            hideControls: true,
            resetOnEnd: false,
            loadSprite: true,
            iconUrl: PLYR_ICON_URL,
            storage: { enabled: false },
            keyboard: { focused: true, global: false },
            tooltips: { controls: true, seek: true },
            fullscreen: { enabled: true, fallback: true, iosNative: true },
            settings: ['captions', 'speed'],
            captions: { active: true, language: 'auto', update: true },
            speed: { selected: 1, options: [0.75, 1, 1.25] },
            controls: [
                'play-large',
                'rewind',
                'play',
                'fast-forward',
                'progress',
                'current-time',
                'duration',
                'mute',
                'volume',
                'captions',
                'settings',
                'pip',
                'fullscreen',
            ],
        });

        player.on('ready', () => {
            tryStartPlayback();
            startupTimer = setTimeout(() => tryStartPlayback(true), policy.maxStartupWait);
        });

        // Captions load independently so a slow subtitle endpoint never delays
        // video startup. Plyr observes tracks added after initialization.
        addCaptionTracks(media, selectedVideo, captionBlobUrls).then((trackCount) => {
            if (destroyed) {
                captionBlobUrls.forEach(url => URL.revokeObjectURL(url));
                return;
            }
            if (trackCount > 0) {
                try { player?.toggleCaptions?.(true); } catch {}
            }
        });
    }

    backButton.addEventListener('click', () => {
        cleanup();
        navigate('#story');
    });

    registerRouteCleanup(cleanup);
    return container;
}

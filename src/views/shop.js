import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { registerRouteCleanup } from '../js/router.js';

const GAMES_BACKEND_ORIGIN = 'http://54.196.133.35:3700';
const GAMES_API_URL = `${GAMES_BACKEND_ORIGIN}/api/games`;
const LOCAL_GAMES_API_URL = '/games-api/games';
const FALLBACK_GAMES = [
    {
        id: 1,
        name: "Noah's Ark Adventure",
        category: 'Story',
        url: 'https://webgl-test-v1.vercel.app/',
        banner_url: `${GAMES_BACKEND_ORIGIN}/uploads/noah-banner.png`,
    },
];
const unityLoaderPromises = new Map();

function resolveGameAssetUrl(url) {
    if (!url) return '';
    if (url.startsWith('/assets/')) return url;
    const absoluteUrl = (() => {
        try {
            return new URL(url, `${GAMES_BACKEND_ORIGIN}/`).toString();
        } catch {
            return url;
        }
    })();
    if (import.meta.env.DEV && url.startsWith(`${GAMES_BACKEND_ORIGIN}/uploads/`)) {
        return `/game-uploads${new URL(absoluteUrl).pathname.slice('/uploads'.length)}`;
    }
    if (import.meta.env.DEV && absoluteUrl.startsWith(`${GAMES_BACKEND_ORIGIN}/uploads/`)) {
        return `/game-uploads${new URL(absoluteUrl).pathname.slice('/uploads'.length)}`;
    }
    return absoluteUrl;
}

function normalizeGame(item) {
    return {
        id: item?.id ?? crypto.randomUUID?.() ?? String(Date.now()),
        name: item?.name || 'Bible Game Adventure',
        category: item?.category || 'Game',
        url: item?.url || 'https://webgl-test-v1.vercel.app/',
        bannerUrl: resolveGameAssetUrl(item?.banner_url || item?.banner_path || '/assets/images/home/bible-game-banner.png'),
    };
}

async function fetchGames() {
    try {
        if (Capacitor.isNativePlatform()) {
            const response = await CapacitorHttp.get({
                url: GAMES_API_URL,
                responseType: 'json',
            });
            const payload = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const games = Array.isArray(payload?.data) ? payload.data : [];
            return games.map(normalizeGame);
        }

        const response = await fetch(import.meta.env.DEV ? LOCAL_GAMES_API_URL : GAMES_API_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const games = Array.isArray(payload?.data) ? payload.data : [];
        return games.map(normalizeGame);
    } catch (error) {
        console.warn('[GAME API] Falling back to bundled game data:', error);
        return FALLBACK_GAMES.map(normalizeGame);
    }
}

function gamePageUrl(gameUrl) {
    try {
        return new URL(gameUrl).toString();
    } catch {
        return 'https://webgl-test-v1.vercel.app/';
    }
}

function resolveUnityUrl(path, pageUrl) {
    return new URL(path, pageUrl).toString();
}

async function resolveUnityBuild(gameUrl) {
    const pageUrl = gamePageUrl(gameUrl);
    let html = '';

    try {
        const response = await fetch(pageUrl, { headers: { 'Accept': 'text/html' } });
        if (response.ok) html = await response.text();
    } catch {
        html = '';
    }

    const readConfigValue = (key) => {
        const match = html.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`, 'i'));
        return match?.[1] || '';
    };

    const loaderMatch = html.match(/<script[^>]+src=["']([^"']+\.loader\.js)["']/i);
    const baseUrl = new URL('./', pageUrl).toString();

    return {
        loaderUrl: resolveUnityUrl(loaderMatch?.[1] || 'Build/TT.loader.js', pageUrl),
        dataUrl: resolveUnityUrl(readConfigValue('dataUrl') || 'Build/TT.data', pageUrl),
        frameworkUrl: resolveUnityUrl(readConfigValue('frameworkUrl') || 'Build/TT.framework.js', pageUrl),
        codeUrl: resolveUnityUrl(readConfigValue('codeUrl') || 'Build/TT.wasm', pageUrl),
        streamingAssetsUrl: resolveUnityUrl(readConfigValue('streamingAssetsUrl') || 'StreamingAssets', baseUrl),
        companyName: readConfigValue('companyName') || 'DefaultCompany',
        productName: readConfigValue('productName') || 'Bible Trivia Adventure',
        productVersion: readConfigValue('productVersion') || '1.0',
    };
}

function ensureUnityLoader(loaderUrl) {
    if (unityLoaderPromises.has(loaderUrl)) return unityLoaderPromises.get(loaderUrl);

    const loaderPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${loaderUrl}"]`);
        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                resolve();
                return;
            }
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Unity loader failed')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = loaderUrl;
        script.async = true;
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = () => reject(new Error('Unity loader failed'));
        document.head.appendChild(script);
    });

    unityLoaderPromises.set(loaderUrl, loaderPromise);
    return loaderPromise;
}

export function renderShop() {
    const container = document.createElement('div');
    container.className = 'screen bg-[#0d0d0d] text-white font-baloo relative';
    container.style.cssText = 'position:absolute;inset:0;overflow:hidden;';

    container.innerHTML = `
        <div class="flex flex-col w-full h-full">
            <div style="width:100%; height:calc(env(safe-area-inset-top,0px) + 46px); padding-top:env(safe-area-inset-top,0px); box-sizing:border-box; display:flex; align-items:center; justify-content:center; background:#0D0D0D; flex-shrink:0;">
                <h1 style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:500; font-size:28px; line-height:26px; color:#FFFFFF; text-align:center;">Game</h1>
            </div>

            <div id="game-list-view" style="flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding:24px 16px calc(110px + env(safe-area-inset-bottom,0px)); box-sizing:border-box;">
                <div id="game-list-content" style="display:flex; flex-direction:column; gap:16px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <h2 style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:600; font-size:28px; line-height:36px; color:#FFFFFF;">Games</h2>
                        <span id="game-count-label" style="font-family:'Baloo 2',sans-serif; font-weight:400; font-size:16px; line-height:24px; color:#838383;">Loading...</span>
                    </div>
                    <div id="game-card-list" style="display:flex; flex-wrap:wrap; gap:16px;">
                        <div class="skeleton" style="width:calc(50% - 8px); aspect-ratio:1/1; border-radius:12px;"></div>
                        <div class="skeleton" style="width:calc(50% - 8px); aspect-ratio:1/1; border-radius:12px;"></div>
                        <div class="skeleton" style="width:calc(50% - 8px); aspect-ratio:1/1; border-radius:12px;"></div>
                        <div class="skeleton" style="width:calc(50% - 8px); aspect-ratio:1/1; border-radius:12px;"></div>
                    </div>
                </div>
            </div>

            <div id="game-frame-view" style="display:none; position:fixed; inset:0; width:100vw; height:100vh; height:100dvh; z-index:10050; background:#231F20; overflow:hidden; box-sizing:border-box; overscroll-behavior:none;">
                <div style="width:100%; height:100%; position:relative; overflow:hidden;">
                    <div style="position:absolute; top:calc(env(safe-area-inset-top,0px) + 10px); left:10px; right:10px; display:flex; align-items:center; justify-content:space-between; gap:8px; z-index:2; pointer-events:none;">
                        <button id="game-frame-back" type="button" aria-label="Back to games" style="width:44px; height:44px; border-radius:999px; border:none; background:rgba(10,10,10,0.68); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:0; cursor:pointer; flex-shrink:0; pointer-events:auto;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M13.3333 10H2.22217" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7.22217 15L2.22217 10L7.22217 5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <div id="game-frame-fit" style="width:100vw; height:100vh; height:100dvh; overflow:hidden;">
                        <div id="game-frame-shell" style="position:relative; width:100%; height:100%; border-radius:0; overflow:hidden; border:none; background:#231F20; box-shadow:none;">
                        <div id="game-frame-loading" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:radial-gradient(circle at top, rgba(254,195,72,0.14), transparent 40%), #111111; z-index:1; text-align:center; padding:24px; pointer-events:none;">
                            <div style="width:44px; height:44px; border-radius:999px; border:3px solid rgba(254,195,72,0.18); border-top-color:#FEC348; animation:game-spin 0.9s linear infinite;"></div>
                            <p style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:600; font-size:20px; line-height:28px; color:#FFFFFF;">Loading game...</p>
                            <p style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:400; font-size:14px; line-height:20px; color:#838383; max-width:260px;">The WebGL game is opening inside the app.</p>
                        </div>
                        <canvas id="game-canvas" tabindex="0" aria-label="Bible Game Adventure" style="position:absolute; inset:0; width:100vw; height:100vh; height:100dvh; border:none; display:block; background:#231F20; pointer-events:auto; touch-action:none; -webkit-user-select:none; user-select:none;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <style>
            @keyframes game-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    const listView = container.querySelector('#game-list-view');
    const frameView = container.querySelector('#game-frame-view');
    const cardList = container.querySelector('#game-card-list');
    const countLabel = container.querySelector('#game-count-label');
    const backButton = container.querySelector('#game-frame-back');
    const canvas = container.querySelector('#game-canvas');
    const loading = container.querySelector('#game-frame-loading');
    const fitHost = container.querySelector('#game-frame-fit');
    const frameShell = container.querySelector('#game-frame-shell');
    const initialLoadingMarkup = loading?.innerHTML || '';
    const pageContent = document.getElementById('page-content');
    const initialBottomNav = document.getElementById('global-bottom-nav');
    const previousPageOverflow = pageContent?.style.overflow;
    const previousPageTouchAction = pageContent?.style.touchAction;
    const previousNavDisplay = initialBottomNav?.style.display;
    let loadGameTimer = 0;
    let loadSeq = 0;
    let unityInstance = null;
    let selectedGame = normalizeGame(FALLBACK_GAMES[0]);

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function gameCardMarkup(game, index) {
        return `
            <button class="game-launch-card" data-game-index="${index}" type="button" aria-label="Open ${escapeHtml(game.name)}" style="width:100%; max-width:172px; padding:0; border:none; background:transparent; display:block; cursor:pointer; -webkit-tap-highlight-color:transparent;">
                <div style="width:100%; aspect-ratio:2 / 3; position:relative; border-radius:14px; overflow:hidden; border:1px solid #444444; background:#121212; box-shadow:0 18px 40px rgba(0,0,0,0.28);">
                    <img src="${escapeHtml(game.bannerUrl)}" alt="${escapeHtml(game.name)}" style="width:100%; height:100%; object-fit:cover; object-position:center; display:block; pointer-events:none;" loading="lazy" decoding="async" draggable="false" onerror="this.onerror=null;this.src='/assets/images/home/bible-game-banner.png';" />
                    <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(5,9,20,0.04) 0%, rgba(5,9,20,0.18) 50%, rgba(5,9,20,0.92) 100%);"></div>
                    <div style="position:absolute; top:10px; left:10px; display:inline-flex; align-items:center; justify-content:center; min-width:76px; height:28px; padding:0 10px; border-radius:999px; background:rgba(254,195,72,0.94); color:#111111; font-family:'Baloo 2',sans-serif; font-weight:600; font-size:13px; line-height:18px;">
                        ${escapeHtml(game.category)}
                    </div>
                    <div style="position:absolute; inset:auto 12px 12px 12px; display:flex; flex-direction:column; gap:8px; text-align:left;">
                        <p style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:600; font-size:19px; line-height:24px; color:#FFFFFF;">
                            ${escapeHtml(game.name)}
                        </p>
                        <div style="display:flex; align-items:center; justify-content:center; width:100%; height:38px; border-radius:999px; background:#FEC348; color:#0D0D0D; font-family:'Baloo 2',sans-serif; font-weight:600; font-size:16px; line-height:20px;">
                            Play Game
                        </div>
                    </div>
                </div>
            </button>
        `;
    }

    function renderGameCards(games) {
        if (!cardList) return;
        const safeGames = games.length ? games : FALLBACK_GAMES.map(normalizeGame);
        cardList.innerHTML = safeGames.map(gameCardMarkup).join('');
        if (countLabel) countLabel.textContent = `${safeGames.length} game${safeGames.length === 1 ? '' : 's'}`;
        cardList.querySelectorAll('.game-launch-card').forEach((card) => {
            card.addEventListener('click', () => {
                const index = Number(card.dataset.gameIndex || 0);
                selectedGame = safeGames[index] || safeGames[0];
                showFrame();
            });
        });
    }

    function lockGameTouch() {
        if (pageContent) {
            pageContent.style.overflow = 'hidden';
            pageContent.style.touchAction = 'none';
        }
        const bottomNav = document.getElementById('global-bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
    }

    function unlockGameTouch() {
        if (pageContent) {
            pageContent.style.overflow = previousPageOverflow || '';
            pageContent.style.touchAction = previousPageTouchAction || '';
        }
        const bottomNav = document.getElementById('global-bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = previousNavDisplay || '';
        }
    }

    function focusGameCanvas() {
        if (!canvas) return;
        try {
            canvas.focus({ preventScroll: true });
        } catch {
            canvas.focus();
        }
    }

    function syncFrameSize() {
        if (!fitHost || !frameShell || !canvas) return;
        const width = Math.max(320, Math.floor(window.innerWidth || document.documentElement.clientWidth || 0));
        const height = Math.max(480, Math.floor(window.innerHeight || document.documentElement.clientHeight || 0));
        const dpr = Math.max(1, window.devicePixelRatio || 1);

        fitHost.style.width = `${width}px`;
        fitHost.style.height = `${height}px`;
        frameShell.style.width = `${width}px`;
        frameShell.style.height = `${height}px`;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
    }

    async function stopUnityGame() {
        window.clearTimeout(loadGameTimer);
        loadSeq += 1;

        const instance = unityInstance;
        unityInstance = null;
        if (instance?.Quit) {
            try {
                await instance.Quit();
            } catch {
                // Unity may already be tearing down.
            }
        }
    }

    async function loadUnityGame(seq) {
        if (!canvas) return;
        syncFrameSize();
        focusGameCanvas();

        try {
            const build = await resolveUnityBuild(selectedGame.url);
            await ensureUnityLoader(build.loaderUrl);
            if (seq !== loadSeq || !window.createUnityInstance) return;

            syncFrameSize();
            const instance = await window.createUnityInstance(canvas, {
                arguments: [],
                dataUrl: build.dataUrl,
                frameworkUrl: build.frameworkUrl,
                codeUrl: build.codeUrl,
                streamingAssetsUrl: build.streamingAssetsUrl,
                companyName: build.companyName,
                productName: build.productName,
                productVersion: build.productVersion,
                devicePixelRatio: Math.max(1, window.devicePixelRatio || 1)
            });

            if (seq !== loadSeq) {
                try {
                    await instance?.Quit?.();
                } catch {
                    // Unity may already be tearing down.
                }
                return;
            }

            unityInstance = instance;
            if (loading) loading.style.display = 'none';
            focusGameCanvas();
        } catch (error) {
            console.error('[GAME] Unity failed to load', error);
            if (loading) {
                loading.style.display = 'flex';
                loading.innerHTML = `
                    <p style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:600; font-size:20px; line-height:28px; color:#FFFFFF;">Game could not load</p>
                    <p style="margin:0; font-family:'Baloo 2',sans-serif; font-weight:400; font-size:14px; line-height:20px; color:#838383; max-width:260px;">Please check the connection and try again.</p>
                `;
            }
        }
    }

    async function showList() {
        await stopUnityGame();
        unlockGameTouch();
        if (loading) {
            if (initialLoadingMarkup) loading.innerHTML = initialLoadingMarkup;
            loading.style.display = 'flex';
        }
        if (listView) listView.style.display = '';
        if (frameView) frameView.style.display = 'none';
    }

    function showFrame() {
        if (listView) listView.style.display = 'none';
        if (frameView) frameView.style.display = 'block';
        lockGameTouch();
        syncFrameSize();
        if (loading) {
            if (initialLoadingMarkup) loading.innerHTML = initialLoadingMarkup;
            loading.style.display = 'flex';
        }
        const seq = ++loadSeq;
        loadGameTimer = window.setTimeout(() => loadUnityGame(seq), 80);
        requestAnimationFrame(focusGameCanvas);
    }

    backButton?.addEventListener('click', showList);
    window.addEventListener('resize', syncFrameSize);
    canvas?.addEventListener('pointerdown', focusGameCanvas);
    canvas?.addEventListener('touchstart', focusGameCanvas, { passive: true });

    renderGameCards([]);
    fetchGames().then((games) => {
        renderGameCards(games);
    });

    registerRouteCleanup(() => {
        stopUnityGame();
        window.removeEventListener('resize', syncFrameSize);
        unlockGameTouch();
    });

    return container;
}

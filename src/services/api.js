import * as mockData from './mockData.js';

const PRODUCTION_API_ORIGIN = 'http://54.196.133.35:3000';
const VIDEO_MEDIA_CDN_ORIGIN = 'https://biblecms-media-2026-app.s3.us-east-1.amazonaws.com';

// ── Auth API ──────────────────────────────────────────────────────────────────
// Real backend: http://54.196.133.35:3000
// Correct endpoints: POST /api/login, POST /api/register
// Social OAuth endpoint: POST /auth/social with { provider, idToken }
// The backend requires a mobile browser User-Agent (blocks curl/bots).
// The Capacitor WebView on Android sends a real Chrome mobile UA automatically.

const AUTH_BASE = PRODUCTION_API_ORIGIN;
const TOKEN_KEY = 'kidsbible_access_token';
const USER_KEY  = 'kidsbible_user';
const REFRESH_TOKEN_KEY = 'kidsbible_refresh_token';
const ID_TOKEN_KEY = 'kidsbible_id_token';
const SESSION_LOCAL_KEYS = [
    TOKEN_KEY,
    USER_KEY,
    REFRESH_TOKEN_KEY,
    ID_TOKEN_KEY,
    'selectedAvatar',
    'kidsbible_subscription',
    'kidsbible_current_video',
];
const SESSION_STORAGE_KEYS = [
    'kidsbible_subscription_return',
    'signup_email',
];

/**
 * Extract JWT token from various possible response shapes.
 * Backend may return: { token }, { accessToken }, { data: { token } }, etc.
 */
function extractToken(data) {
    if (!data || typeof data !== 'object') return null;
    return data.token
        || data.accessToken
        || data.jwt
        || data.access_token
        || data.idToken
        || data.id_token
        || (data.data && (data.data.token || data.data.accessToken))
        || (data.data && (data.data.jwt || data.data.access_token || data.data.idToken || data.data.id_token))
        || null;
}

function extractRefreshToken(data) {
    if (!data || typeof data !== 'object') return null;
    return data.refreshToken
        || data.refresh_token
        || (data.data && (data.data.refreshToken || data.data.refresh_token))
        || null;
}

function extractIdToken(data) {
    if (!data || typeof data !== 'object') return null;
    return data.idToken
        || data.id_token
        || (data.data && (data.data.idToken || data.data.id_token))
        || null;
}

function hasUserLikeFields(value) {
    return !!(value && typeof value === 'object' && !Array.isArray(value) && (
        value.userId || value.uid || value.id || value.email || value.name
        || value.firstName || value.lastName || value.displayName
    ));
}

function withoutAuthTokens(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const {
        token,
        accessToken,
        access_token,
        jwt,
        refreshToken,
        refresh_token,
        idToken,
        id_token,
        ...user
    } = value;
    return user;
}

function extractUser(data, fallbackUser = {}) {
    const candidates = [
        data?.user,
        data?.profile,
        data?.data?.user,
        data?.data?.profile,
        data?.data,
        data,
    ];

    const backendUser = candidates.find(hasUserLikeFields);
    const merged = {
        ...(fallbackUser || {}),
        ...(backendUser ? withoutAuthTokens(backendUser) : {}),
    };

    return hasUserLikeFields(merged) ? merged : null;
}

function persistAuthResult(result, fallbackUser = {}) {
    if (!result?.ok) return;

    const token = result.token || extractToken(result.data);
    const refreshToken = extractRefreshToken(result.data);
    const idToken = extractIdToken(result.data);
    const user = extractUser(result.data, fallbackUser);

    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (idToken) localStorage.setItem(ID_TOKEN_KEY, idToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Map backend error messages to user-friendly English strings.
 * The backend returns Turkish messages — we translate them.
 */
function friendlyError(status, body) {
    if (!navigator.onLine) return 'No internet connection. Please check your network.';
    if (status === 0 || status === null) return 'Cannot reach the server. Please try again.';
    if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (status === 503 || status === 502) return 'Server is temporarily unavailable. Please try again later.';

    // Try to parse JSON error message
    let msg = '';
    try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        msg = parsed.message || parsed.error || parsed.msg || '';
    } catch { msg = typeof body === 'string' ? body : ''; }

    // Map known Turkish/English backend messages
    if (msg.includes('bulunamad') || msg.includes('not found') || status === 404) {
        return 'No account found with this email address.';
    }
    if (msg.includes('hatal') || msg.includes('yanl') || msg.includes('incorrect') || msg.includes('invalid') || status === 401) {
        return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('mevcut') || msg.includes('already') || msg.includes('exists') || status === 409) {
        return 'An account with this email already exists. Please log in instead.';
    }
    if (msg.includes('gerekli') || msg.includes('required') || msg.includes('eksik') || status === 400) {
        return 'Please fill in all required fields correctly.';
    }
    if (msg.includes('engellendi') || msg.includes('blocked') || msg.includes('User-Agent')) {
        return 'Access denied. Please update the app.';
    }
    if (status >= 500) return 'Server error. Please try again later.';
    if (msg) return msg.substring(0, 120);
    return 'Something went wrong. Please try again.';
}

function friendlySocialError(provider, result) {
    const label = provider === 'google' ? 'Google Sign-In' : 'Social sign-in';

    if (result.status === 404 || result.status === 405) {
        return `${label} is not enabled on the server yet.`;
    }
    if (result.status === 400) {
        return `${label} could not be completed. Please try again.`;
    }
    if (result.status === 401 || result.status === 403) {
        return `${label} could not be verified. Please try again.`;
    }
    return result.error || `${label} failed. Please try again.`;
}

function friendlyDeleteAccountError(status, body) {
    if (!navigator.onLine) return 'No internet connection. Please check your network.';
    if (status === 0 || status === null) return 'Cannot reach the server. Please try again.';
    if (status === 401 || status === 403) return 'Please sign in again before deleting your account.';
    if (status === 404 || status === 405) return 'Account deletion is not available on the server yet.';
    if (status === 409) return 'Your account cannot be deleted right now. Please contact support.';
    if (status >= 500) return 'Server error. Please try again later.';

    let msg = '';
    try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        msg = parsed.message || parsed.error || parsed.msg || '';
    } catch { msg = typeof body === 'string' ? body : ''; }

    return msg ? msg.substring(0, 160) : 'We could not delete your account right now.';
}

/**
 * POST to the auth backend.
 * Returns { ok: true, data, token } or { ok: false, error: string }
 */
async function authPost(path, payload) {
    try {
        const resp = await fetch(AUTH_BASE + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        let data = null;
        let rawBody = '';
        try {
            rawBody = await resp.text();
            data = JSON.parse(rawBody);
        } catch { data = null; }

        if (resp.ok) {
            const token = extractToken(data);
            return { ok: true, data, token, status: resp.status };
        } else {
            return { ok: false, error: friendlyError(resp.status, rawBody || data), status: resp.status };
        }
    } catch (err) {
        console.error('[AUTH] Network error:', err);
        const msg = err.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('net::')) {
            return { ok: false, error: 'Cannot reach the server. Please check your internet connection.', status: 0 };
        }
        return { ok: false, error: 'Network error. Please try again.', status: 0 };
    }
}

export const auth = {
    /**
     * Register a new user.
     * @param {{ firstName, lastName, email, phoneNumber, password }} payload
     * @returns {{ ok, token, data, error }}
     */
    async register(payload) {
        const result = await authPost('/api/register', payload);
        persistAuthResult(result);
        return result;
    },

    /**
     * Log in an existing user.
     * @param {{ email, password }} payload
     * @returns {{ ok, token, data, error }}
     */
    async login(payload) {
        const result = await authPost('/api/login', payload);
        persistAuthResult(result);
        return result;
    },

    /**
     * Login/register with a social OAuth provider.
     * Google sends its native ID token here; the backend verifies it and returns
     * the app session token used by the rest of the API.
     * @param {'google'|'apple'} provider
     * @param {string} idToken
     * @param {Object} profileFallback
     * @returns {{ ok, token, data, error, status }}
     */
    async socialLogin(provider, idToken, profileFallback = {}) {
        if (!provider || !idToken) {
            return { ok: false, error: 'Google Sign-In did not return a valid token.', status: 400 };
        }

        const payload = { provider, idToken };
        let result = await authPost('/auth/social', payload);

        // Some deployments keep every auth route under /api. Retry only when the
        // canonical social-auth route is clearly missing.
        if (!result.ok && (result.status === 404 || result.status === 405)) {
            const fallback = await authPost('/api/auth/social', payload);
            if (fallback.ok || !(fallback.status === 404 || fallback.status === 405)) {
                result = fallback;
            }
        }

        persistAuthResult(result, {
            ...profileFallback,
            authProvider: provider,
            provider,
        });
        return result.ok ? result : { ...result, error: friendlySocialError(provider, result) };
    },

    /**
     * Email/password compatibility flow for deployments that do not expose a
     * social-auth endpoint yet. The password is derived by the Google flow from
     * the Google account id, so it is stable but not shared by every user.
     */
    async googleEmailLoginOrRegister(credentials, profileFallback = {}) {
        const { email, password, firstName, lastName, phoneNumber } = credentials;
        if (!email || !password) {
            return { ok: false, error: 'Google did not return a valid email address.', status: 400 };
        }

        let loginResult = await authPost('/api/login', { email, password });
        if (loginResult.ok) {
            persistAuthResult(loginResult, {
                ...profileFallback,
                email,
                authProvider: 'google',
                provider: 'google',
            });
            return { ...loginResult, isNewUser: false };
        }

        // A network/server failure will affect registration as well. Avoid a
        // second request unless login clearly reports missing/wrong credentials.
        if (![400, 401, 404].includes(loginResult.status)) return loginResult;

        const registerResult = await authPost('/api/register', {
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
        });

        if (!registerResult.ok) {
            // If this email already belongs to a normal password account, never
            // replace or weaken it through the Google compatibility flow.
            if (registerResult.status === 409) {
                return {
                    ok: false,
                    status: 409,
                    error: 'This email already has an account. Please log in with its existing password.',
                };
            }
            return registerResult;
        }

        // Always obtain the same session shape as a normal login. If the
        // register endpoint already returned a token, keep it as a safe fallback.
        loginResult = await authPost('/api/login', { email, password });
        const finalResult = loginResult.ok ? loginResult : registerResult;
        persistAuthResult(finalResult, {
            ...profileFallback,
            email,
            authProvider: 'google',
            provider: 'google',
        });
        return { ...finalResult, isNewUser: true };
    },

    /** Get stored JWT token, or null if not logged in. */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    /** Get stored user object, or null. */
    getUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },

    /** Return the backend user identifier across supported response shapes. */
    getUserId() {
        const user = this.getUser();
        return user?.uid ?? user?.id ?? user?.userId ?? null;
    },

    /** Check if user is logged in (has a token). */
    isLoggedIn() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    clearStoredSession() {
        SESSION_LOCAL_KEYS.forEach((key) => {
            localStorage.removeItem(key);
        });
        SESSION_STORAGE_KEYS.forEach((key) => {
            try { sessionStorage.removeItem(key); } catch {}
        });
    },

    /** Log out — clear stored credentials. */
    logout() {
        this.clearStoredSession();
    },

    /**
     * Make an authenticated fetch request.
     * Automatically adds Authorization: Bearer <token> header.
     */
    async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
        return fetch(url, { ...options, headers });
    },

    /**
     * Delete the currently authenticated account.
     * The backend documentation does not yet define a canonical route, so we
     * try the most common authenticated deletion endpoints used by existing
     * deployments and stop at the first supported one.
     */
    async deleteAccount() {
        const token = this.getToken();
        const user = this.getUser() || {};
        const uid = this.getUserId();

        if (!token) {
            return { ok: false, status: 401, error: 'Please sign in again before deleting your account.' };
        }

        const payload = {
            userId: uid,
            uid,
            email: user.email || null,
        };

        const candidates = [
            { method: 'DELETE', path: '/api/account', body: payload },
            { method: 'DELETE', path: '/api/users/me', body: payload },
            ...(uid !== null && uid !== undefined && uid !== '' ? [
                { method: 'DELETE', path: `/api/users/${encodeURIComponent(uid)}`, body: payload },
            ] : []),
            { method: 'POST', path: '/api/account/delete', body: payload },
            { method: 'POST', path: '/api/users/delete', body: payload },
            { method: 'POST', path: '/api/auth/delete', body: payload },
        ];

        for (const candidate of candidates) {
            try {
                const resp = await this.authenticatedFetch(`${AUTH_BASE}${candidate.path}`, {
                    method: candidate.method,
                    headers: { 'Accept': 'application/json' },
                    ...(candidate.body ? { body: JSON.stringify(candidate.body) } : {}),
                });

                let rawBody = '';
                let data = null;
                try {
                    rawBody = await resp.text();
                    data = rawBody ? JSON.parse(rawBody) : null;
                } catch {
                    data = null;
                }

                if (resp.ok) {
                    return { ok: true, status: resp.status, data };
                }

                if (resp.status === 404 || resp.status === 405) {
                    continue;
                }

                return {
                    ok: false,
                    status: resp.status,
                    data,
                    error: friendlyDeleteAccountError(resp.status, rawBody || data),
                };
            } catch (error) {
                console.error('[AUTH] Delete account network error:', error);
                return {
                    ok: false,
                    status: 0,
                    error: friendlyDeleteAccountError(0, null),
                };
            }
        }

        return {
            ok: false,
            status: 404,
            error: 'Account deletion is not available on the server yet.',
        };
    },
};

// ── Mock data helpers ─────────────────────────────────────────────────────────
// Simulated API delay — replace with real HTTP calls when backend is ready
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function formatNotificationTime(createdAt) {
    if (!createdAt) return 'now';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return String(createdAt);

    const ageMs = Date.now() - date.getTime();
    if (ageMs >= 0 && ageMs < 60_000) return 'now';
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export const api = {
    async getHomeData() {
        await delay(100);
        return {
            categories: mockData.mockCategories,
            oldTestament: mockData.mockStories.filter(s => s.type === 'Old Testament'),
            audioOldTestament: mockData.mockAudio.filter(a => a.category === 'Old Audio Testament'),
            newTestament: mockData.mockStories.filter(s => s.type === 'New Testament'),
            audioNewTestament: mockData.mockAudio.filter(a => a.category === 'New Audio Testament'),
            hebrewMusic: mockData.mockMusic.filter(m => m.type === 'Hebrew Biblical Music'),
            christianMusic: mockData.mockMusic.filter(m => m.type === 'Christian Biblical Music')
        };
    },

    async getAudioLibrary() {
        await delay(100);
        return mockData.mockAudio;
    },

    async getStories() {
        await delay(100);
        return mockData.mockStories;
    },

    async getStoryContent(idOrSlug) {
        await delay(100);
        const story = mockData.mockStories.find(
            s => s.id === idOrSlug || s.title.toLowerCase() === String(idOrSlug).toLowerCase()
        );
        return story || mockData.mockStories[0];
    },

    async getShopProducts() {
        await delay(100);
        return mockData.mockShopProducts;
    },

    async getProducts() {
        return this.getShopProducts();
    },

    async getProductDetails(id) {
        await delay(100);
        return mockData.mockShopProducts.find(p => p.id === id) || mockData.mockShopProducts[0];
    },

    async getNotifications() {
        const url = import.meta.env.DEV
            ? '/music-api/notifications'
            : `${PRODUCTION_API_ORIGIN}/api/notifications`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const payload = await response.json();
            const notifications = Array.isArray(payload)
                ? payload
                : (payload?.notifications || payload?.data || []);

            return notifications.map(item => ({
                ...item,
                id: String(item.id),
                body: item.message || item.body || '',
                time: formatNotificationTime(item.createdAt),
                read: Boolean(item.read),
            }));
        } catch (error) {
            console.error('[NOTIFICATIONS API] Request failed:', error);
            return [];
        }
    },

    async search(query) {
        await delay(150);
        const q = query.toLowerCase();
        const stories = mockData.mockStories.filter(s => s.title.toLowerCase().includes(q));
        const audio = mockData.mockAudio.filter(a => a.title.toLowerCase().includes(q));
        return { stories, audio };
    },
};

// ── Music Items API ───────────────────────────────────────────────────────────
// Real backend: GET http://54.196.133.35:3000/api/music-items
// Optional query param: ?type=Hebrew Biblical Music  or  ?type=Christian Music
// Required header: User-Agent: bible-appclient
//
// Response shape per item:
//   { id, title, type, image, audioUrl, createdAt }
//   Note: image/audioUrl may be relative paths like /uploads/file.jpg
//
// In the browser (dev server), requests go through Vite proxy to avoid
// Cross-Origin-Resource-Policy: same-origin blocking:
//   /music-api/*      → https://16-171-22-191.sslip.io/api/*
//   /music-uploads/*  → https://16-171-22-191.sslip.io/uploads/*
//
// On Android (Capacitor WebView), the app talks directly to the HTTPS host.

const MUSIC_BACKEND_ORIGIN = PRODUCTION_API_ORIGIN;
const MUSIC_API_BASE = import.meta.env.DEV ? '/music-api' : `${MUSIC_BACKEND_ORIGIN}/api`;
const MUSIC_BACKEND_HOSTNAMES = new Set([
    new URL(MUSIC_BACKEND_ORIGIN).hostname,
    '54.196.133.35',
]);

/**
 * Resolve a music resource URL to a full absolute URL on the backend.
 * Relative paths like /uploads/file.jpg -> http://54.196.133.35:3000/uploads/file.jpg
 */
function resolveMusicUrl(url) {
    if (!url) return '';
    if (import.meta.env.DEV && url.startsWith('/music-uploads/')) return url;

    try {
        const resolved = new URL(url, `${MUSIC_BACKEND_ORIGIN}/`);

        // Keep media requests same-origin during local development. This also
        // avoids the backend's Cross-Origin-Resource-Policy restriction.
        if (import.meta.env.DEV
            && MUSIC_BACKEND_HOSTNAMES.has(resolved.hostname)
            && resolved.pathname.startsWith('/uploads/')) {
            return `/music-uploads${resolved.pathname.slice('/uploads'.length)}${resolved.search}${resolved.hash}`;
        }

        return resolved.toString();
    } catch {
        return url;
    }
}

/**
 * Fetch a remote resource (image or audio) and return a local blob: URL.
 * This bypasses Cross-Origin-Resource-Policy restrictions because the
 * fetch is made by JS (not the browser loading a resource tag directly),
 * and the resulting blob: URL is same-origin.
 *
 * @param {string} url - resource URL to fetch
 * @returns {Promise<string>} blob: URL, or the original URL on failure
 */
export async function fetchAsBlobUrl(url) {
    if (!url) return url;
    try {
        const resp = await fetch(url, { method: 'GET' });
        if (!resp.ok) return url;
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    } catch (err) {
        console.warn('[MUSIC] fetchAsBlobUrl failed for', url, err);
        return url;
    }
}

/**
 * Get the API URL for music items endpoint.
 */
function getMusicApiUrl(path) {
    const pathWithoutApiPrefix = path.replace(/^\/api(?=\/|$)/, '');
    return `${MUSIC_API_BASE}${pathWithoutApiPrefix}`;
}

let _musicItemsCache = null;

export const musicItemsApi = {
    /**
     * Fetch all published music items, optionally filtered by type (e.g. 'hebrew').
     * @param {string|null} type - Filter by type if provided.
     * @returns {Promise<Array>} array of { id, title, type, image, audioUrl, createdAt }
     */
    async getMusicItems(type = null) {
        if (!type && _musicItemsCache) return _musicItemsCache;

        const request = (async () => {
            try {
                let url = getMusicApiUrl('/api/music-items');
                if (type) url += `?type=${encodeURIComponent(type)}`;

                const resp = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });

                if (!resp.ok) {
                    console.error('[MUSIC API] Error:', resp.status);
                    if (!type) _musicItemsCache = null;
                    return [];
                }

                const data = await resp.json();
                if (!Array.isArray(data)) {
                    if (!type) _musicItemsCache = null;
                    return [];
                }

                // Resolve relative image and audio URLs
                return data.map(item => ({
                    ...item,
                    image:    resolveMusicUrl(item.image),
                    audioUrl: resolveMusicUrl(item.audioUrl),
                }));
            } catch (err) {
                console.error('[MUSIC API] Network error:', err);
                if (!type) _musicItemsCache = null;
                return [];
            }
        })();

        if (!type) _musicItemsCache = request;
        return request;
    },

    /**
     * Fetch a single music item by ID.
     * @param {number|string} id
     * @returns {Promise<Object|null>}
     */
    async getMusicItemById(id) {
        try {
            const resp = await fetch(getMusicApiUrl(`/api/music-items/${id}`), {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            if (!resp.ok) return null;
            const item = await resp.json();
            return { ...item, image: resolveMusicUrl(item.image), audioUrl: resolveMusicUrl(item.audioUrl) };
        } catch (err) {
            console.error('[MUSIC API] Network error:', err);
            return null;
        }
    },
};

// Keep audioItemsApi as alias for backward compatibility
export const audioItemsApi = musicItemsApi;

// ── Videos / Stories API ──────────────────────────────────────────────────────
// Backend: http://54.196.133.35:3000
// GET /api/videos    → array of video objects
// GET /api/categories → array of category objects
// Required header: User-Agent: bible-appclient

const VIDEOS_API_BASE = PRODUCTION_API_ORIGIN;

function resolveVideoUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${VIDEOS_API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function deriveVideoMediaOrigin(item = {}) {
    const candidates = [
        item.subtitleUrl,
        item.videoUrl,
        item.verticalBannerUrl,
        item.posterUrl,
    ];
    for (const candidate of candidates) {
        try {
            const parsed = new URL(candidate);
            return `${parsed.protocol}//${parsed.host}`;
        } catch {}
    }
    return VIDEO_MEDIA_CDN_ORIGIN;
}

function resolveVideoCaptionUrl(url, item = {}) {
    if (!url) return '';
    if (String(url).startsWith('http://') || String(url).startsWith('https://')) return String(url);

    const normalized = String(url);
    if (normalized.startsWith('kidsbible-content/')) {
        return `${deriveVideoMediaOrigin(item)}/${normalized}`;
    }
    if (normalized.startsWith('/kidsbible-content/')) {
        return `${deriveVideoMediaOrigin(item)}${normalized}`;
    }
    return resolveVideoUrl(normalized);
}

function inferCaptionFormat(url = '', explicitFormat = '') {
    const normalizedFormat = String(explicitFormat).toLowerCase().replace(/^\./, '');
    if (normalizedFormat.includes('srt') || normalizedFormat.includes('subrip')) return 'srt';
    if (normalizedFormat.includes('vtt') || normalizedFormat.includes('webvtt')) return 'vtt';

    try {
        const extension = new URL(url, `${VIDEOS_API_BASE}/`).pathname.split('.').pop().toLowerCase();
        return extension === 'srt' ? 'srt' : 'vtt';
    } catch {
        return String(url).toLowerCase().includes('.srt') ? 'srt' : 'vtt';
    }
}

function normalizeCaptionTrack(track, index, languageHint = '', sourceItem = {}) {
    const value = typeof track === 'string' ? { url: track } : (track || {});
    const possibleContent = value.content || value.data || value.text || '';
    const rawUrl = value.url
        || value.src
        || value.fileUrl
        || value.file
        || value.path
        || value.subtitlePath
        || value.captionPath
        || value.subtitleKey
        || value.captionKey
        || value.srtUrl
        || value.srtFileUrl
        || value.srtFile
        || value.vttUrl
        || value.subtitleUrl
        || value.subtitleFileUrl
        || value.subtitleFile
        || value.captionUrl
        || '';
    const content = String(possibleContent || (String(rawUrl).includes('-->') ? rawUrl : ''));
    const url = content ? '' : resolveVideoCaptionUrl(String(rawUrl), sourceItem);

    if (!url && !content) return null;

    const language = String(
        value.srclang || value.languageCode || value.language || value.lang || languageHint || 'en'
    ).toLowerCase();

    return {
        url,
        content,
        format: inferCaptionFormat(url, value.format || value.type || value.mimeType),
        language,
        label: String(value.label || value.name || value.title || language.toUpperCase() || `Captions ${index + 1}`),
        default: Boolean(value.default || value.isDefault),
    };
}

/** Normalize the caption shapes used by current and older backend deployments. */
export function normalizeVideoCaptions(item = {}) {
    const captions = [];
    const grouped = item.captions
        ?? item.subtitles
        ?? item.captionTracks
        ?? item.subtitleTracks
        ?? item.captionFiles
        ?? item.subtitleFiles;

    if (Array.isArray(grouped)) {
        captions.push(...grouped.map((track, index) => normalizeCaptionTrack(track, index, '', item)));
    } else if (typeof grouped === 'string') {
        captions.push(normalizeCaptionTrack(grouped, 0, '', item));
    } else if (grouped && typeof grouped === 'object') {
        const looksLikeTrack = [
            'url', 'src', 'fileUrl', 'path', 'srtUrl', 'srtFileUrl', 'srtFile',
            'vttUrl', 'subtitleUrl', 'subtitleFileUrl', 'subtitleKey', 'captionKey',
            'subtitlePath', 'captionPath', 'content', 'data',
        ]
            .some(key => Object.prototype.hasOwnProperty.call(grouped, key));
        if (looksLikeTrack) {
            captions.push(normalizeCaptionTrack(grouped, 0, '', item));
        } else {
            captions.push(...Object.entries(grouped).map(([language, track], index) => (
                normalizeCaptionTrack(track, index, language, item)
            )));
        }
    }

    [
        ['subtitleKey', 'srt'],
        ['captionKey', 'srt'],
        ['subtitlePath', 'srt'],
        ['captionPath', 'srt'],
        ['srtUrl', 'srt'],
        ['srtFileUrl', 'srt'],
        ['srtFile', 'srt'],
        ['subtitleUrl', ''],
        ['subtitleFileUrl', ''],
        ['subtitleFile', ''],
        ['captionsUrl', ''],
        ['captionUrl', ''],
        ['vttUrl', 'vtt'],
    ].forEach(([key, format]) => {
        if (!item[key]) return;
        captions.push(normalizeCaptionTrack({ url: item[key], format }, captions.length, '', item));
    });

    const seen = new Set();
    return captions.filter(Boolean).filter(track => {
        const identity = `${track.url}\u0000${track.content}\u0000${track.language}`;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
    });
}

let _videosCache = null;
let _categoriesCache = null;

export const videosApi = {
    /**
     * Fetch all published videos.
     * @returns {Promise<Array>} array of { id, title, slug, categoryId, category, videoUrl, verticalBannerUrl, isLocked, isPublished, orderIndex }
     */
    async getVideos() {
        if (_videosCache) return _videosCache;

        _videosCache = (async () => {
            try {
                const resp = await fetch(`${VIDEOS_API_BASE}/api/videos`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });
                if (!resp.ok) {
                    console.error('[VIDEOS API] Error:', resp.status);
                    _videosCache = null;
                    return [];
                }
                const data = await resp.json();
                if (!Array.isArray(data)) {
                    _videosCache = null;
                    return [];
                }
                return data.map(item => ({
                    ...item,
                    verticalBannerUrl: resolveVideoUrl(item.verticalBannerUrl),
                    videoUrl: resolveVideoUrl(item.videoUrl),
                    captions: normalizeVideoCaptions(item),
                }));
            } catch (err) {
                console.error('[VIDEOS API] Network error:', err);
                _videosCache = null;
                return [];
            }
        })();

        return _videosCache;
    },

    /**
     * Fetch all categories.
     * @returns {Promise<Array>} array of { id, name, ... }
     */
    async getCategories() {
        if (_categoriesCache) return _categoriesCache;

        _categoriesCache = (async () => {
            try {
                const resp = await fetch(`${VIDEOS_API_BASE}/api/categories`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });
                if (!resp.ok) {
                    console.error('[VIDEOS API] Categories error:', resp.status);
                    _categoriesCache = null;
                    return [];
                }
                const data = await resp.json();
                if (!Array.isArray(data)) {
                    _categoriesCache = null;
                    return [];
                }
                return data;
            } catch (err) {
                console.error('[VIDEOS API] Categories network error:', err);
                _categoriesCache = null;
                return [];
            }
        })();

        return _categoriesCache;
    },
};

// ── Subscription / Payments API ─────────────────────────────────────

function getBackendApiUrl(path) {
    const normalizedPath = path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`;
    if (import.meta.env.DEV) return `/music-api${normalizedPath.slice('/api'.length)}`;
    return `${VIDEOS_API_BASE}${normalizedPath}`;
}

async function subscriptionRequest(path, options = {}) {
    try {
        const token = auth.getToken();
        const response = await fetch(getBackendApiUrl(path), {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        });

        let data = null;
        try { data = await response.json(); } catch {}

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                data,
                error: data?.message || data?.error || 'Subscription request failed.',
            };
        }
        return { ok: true, status: response.status, data };
    } catch (error) {
        console.error('[SUBSCRIPTION API] Network error:', error);
        return {
            ok: false,
            status: 0,
            data: null,
            error: 'Cannot reach the subscription service. Please try again.',
        };
    }
}

export const subscriptionApi = {
    async check(uid) {
        if (uid === null || uid === undefined || uid === '') {
            return { ok: false, status: 400, data: null, error: 'User ID is missing.' };
        }
        return subscriptionRequest(`/api/subscription/check?uid=${encodeURIComponent(uid)}`);
    },

    async createPayment(payment) {
        return subscriptionRequest('/api/payments', {
            method: 'POST',
            body: JSON.stringify(payment),
        });
    },
};

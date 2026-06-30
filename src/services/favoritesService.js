/**
 * Favorites Service
 *
 * Stores favorites in localStorage, keyed per user email.
 * Key format: kidsbible_favorites_<email>
 *
 * Each favorite item shape:
 *   { id, type, title, subtitle, image, audioUrl?, videoUrl?, duration? }
 *   type: 'audio' | 'story' | 'bedtime' | 'shop'
 */

import { auth } from './api.js';

const FALLBACK_KEY = 'kidsbible_favorites_guest';
const FAVORITE_TYPES = new Set(['audio', 'story', 'bedtime', 'shop']);

function normalizeType(type) {
    return FAVORITE_TYPES.has(type) ? type : null;
}

function getStorageKey() {
    try {
        const user = auth.getUser();
        if (user && user.email) {
            // Sanitize email for use as a key suffix
            const sanitized = user.email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
            return `kidsbible_favorites_${sanitized}`;
        }
    } catch {}
    return FALLBACK_KEY;
}

/**
 * Load all favorites for the current user.
 * Returns { audio: [], story: [], bedtime: [], shop: [] }
 */
export function loadFavorites() {
    try {
        const key = getStorageKey();
        const raw = localStorage.getItem(key);
        if (!raw) return { audio: [], story: [], bedtime: [], shop: [] };
        const parsed = JSON.parse(raw);
        return {
            audio:   Array.isArray(parsed.audio)   ? parsed.audio   : [],
            story:   Array.isArray(parsed.story)   ? parsed.story   : [],
            bedtime: Array.isArray(parsed.bedtime) ? parsed.bedtime : [],
            shop:    Array.isArray(parsed.shop)    ? parsed.shop    : [],
        };
    } catch {
        return { audio: [], story: [], bedtime: [], shop: [] };
    }
}

/**
 * Save favorites object for the current user.
 */
function saveFavorites(favorites) {
    try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(favorites));
        window.dispatchEvent(new CustomEvent('kidsbible:favorites-changed', {
            detail: { key },
        }));
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if an item is favorited.
 * @param {string} id - item id
 * @param {string} type - 'audio' | 'story' | 'bedtime' | 'shop'
 */
export function isFavorite(id, type) {
    const normalizedType = normalizeType(type);
    if (id === null || id === undefined || !normalizedType) return false;
    const favorites = loadFavorites();
    const list = favorites[normalizedType] || [];
    return list.some(item => String(item.id) === String(id));
}

/**
 * Add an item to favorites.
 * @param {object} item - { id, type, title, subtitle, image, ... }
 */
export function addFavorite(item) {
    const type = normalizeType(item?.type);
    if (!item || item.id === null || item.id === undefined || !type) return false;
    const favorites = loadFavorites();
    const list = favorites[type] || [];
    // Avoid duplicates
    if (list.some(f => String(f.id) === String(item.id))) return true;
    list.push({ ...item, id: String(item.id), type });
    favorites[type] = list;
    return saveFavorites(favorites);
}

/**
 * Remove an item from favorites.
 * @param {string} id - item id
 * @param {string} type - 'audio' | 'story' | 'bedtime' | 'shop'
 */
export function removeFavorite(id, type) {
    const normalizedType = normalizeType(type);
    if (id === null || id === undefined || !normalizedType) return false;
    const favorites = loadFavorites();
    const list = favorites[normalizedType] || [];
    favorites[normalizedType] = list.filter(item => String(item.id) !== String(id));
    return saveFavorites(favorites);
}

/**
 * Remove all favorites stored for the current user.
 */
export function clearCurrentUserFavorites() {
    try {
        const key = getStorageKey();
        localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent('kidsbible:favorites-changed', {
            detail: { key },
        }));
        return true;
    } catch {
        return false;
    }
}

/**
 * Toggle favorite status for an item.
 * Returns true if item was added, false if removed.
 */
export function toggleFavorite(item) {
    if (!item || item.id === null || item.id === undefined || !normalizeType(item.type)) return false;
    if (isFavorite(item.id, item.type)) {
        removeFavorite(item.id, item.type);
        return false;
    } else {
        addFavorite(item);
        return true;
    }
}

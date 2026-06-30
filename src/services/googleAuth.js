/**
 * Google Auth Service
 *
 * Wraps the native GoogleAuthPlugin (Capacitor custom plugin).
 * On Android: triggers the native Google Sign-In flow via Play Services.
 * On web/dev: falls back gracefully (not supported).
 *
 * Usage:
 *   import { googleSignIn } from '../services/googleAuth.js';
 *   const result = await googleSignIn();
 *   if (result.ok) {
 *     // result.email, result.displayName, result.idToken, result.givenName, result.familyName
 *   } else {
 *     // result.error
 *   }
 */

import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// Register the native plugin — matches @CapacitorPlugin(name = "GoogleAuth") in Java
const GoogleAuth = registerPlugin('GoogleAuth');

const GOOGLE_SIGN_IN_ERRORS = {
    7: 'Network error while contacting Google. Please check your internet connection.',
    8: 'Google Sign-In had an internal error. Please try again.',
    10: 'Google Sign-In configuration error: Android package/SHA-1 or Web Client ID is not configured correctly.',
    12500: 'Google Sign-In failed. Please check the Google OAuth consent screen and client configuration.',
    12501: 'cancelled',
    12502: 'Google Sign-In is already in progress. Please wait a moment and try again.',
};

function getGoogleErrorCode(err) {
    const raw = err?.code || err?.message || String(err || '');
    const match = String(raw).match(/(?:code\s*:?\s*)?(-?\d{1,5})/i);
    return match ? Number(match[1]) : null;
}

function getGoogleErrorMessage(err) {
    const code = getGoogleErrorCode(err);
    const nativeMessage = err?.message || String(err || '');

    if (code && GOOGLE_SIGN_IN_ERRORS[code]) return GOOGLE_SIGN_IN_ERRORS[code];
    if (nativeMessage.includes('cancelled') || nativeMessage.includes('canceled')) return 'cancelled';
    if (nativeMessage && nativeMessage !== '[object Object]') {
        return `${nativeMessage}${code ? ` (code ${code})` : ''}`;
    }
    return `Google Sign-In failed${code ? ` (code ${code})` : ''}. Please try again.`;
}

/**
 * Trigger Google Sign-In.
 * Returns { ok: true, email, displayName, givenName, familyName, idToken, id, photoUrl }
 * or { ok: false, error: string }
 */
const WEB_CLIENT_ID = '50430621354-nchkp7t573bhqmlk1i0os73vtq4l3m1s.apps.googleusercontent.com';

function loadGSI() {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) return resolve();
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
        document.head.appendChild(script);
    });
}

async function webGoogleSignIn() {
    try {
        await loadGSI();
        return await new Promise((resolve) => {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: WEB_CLIENT_ID,
                scope: 'email profile openid',
                callback: async (tokenResponse) => {
                    if (tokenResponse.error) {
                        return resolve({ ok: false, error: 'Google Sign-In failed or cancelled.' });
                    }
                    try {
                        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                        });
                        if (!res.ok) throw new Error('Failed to fetch user info');
                        const userInfo = await res.json();
                        resolve({
                            ok: true,
                            email: userInfo.email || '',
                            displayName: userInfo.name || '',
                            givenName: userInfo.given_name || '',
                            familyName: userInfo.family_name || '',
                            idToken: '', 
                            id: userInfo.sub || '',
                            photoUrl: userInfo.picture || ''
                        });
                    } catch (e) {
                        resolve({ ok: false, error: 'Failed to fetch user profile.' });
                    }
                }
            });
            client.requestAccessToken();
        });
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

/**
 * Trigger Google Sign-In.
 * Returns { ok: true, email, displayName, givenName, familyName, idToken, id, photoUrl }
 * or { ok: false, error: string }
 */
export async function googleSignIn() {
    if (!Capacitor.isNativePlatform()) {
        return await webGoogleSignIn();
    }

    try {
        // Clear the Google SDK's cached app session first. This makes a login
        // after logout display the account chooser instead of silently reusing
        // the previously selected Google account.
        try { await GoogleAuth.signOut(); } catch {}
        const result = await GoogleAuth.signIn();
        return {
            ok: true,
            email:       result.email       || '',
            displayName: result.displayName || '',
            givenName:   result.givenName   || '',
            familyName:  result.familyName  || '',
            idToken:     result.idToken     || '',
            id:          result.id          || '',
            photoUrl:    result.photoUrl    || '',
        };
    } catch (err) {
        console.error('[GoogleAuth] signIn error:', err);
        const code = getGoogleErrorCode(err);
        const error = getGoogleErrorMessage(err);
        return { ok: false, error, code };
    }
}

/**
 * Sign out from Google.
 */
export async function googleSignOut() {
    if (!Capacitor.isNativePlatform()) return { ok: true };
    try {
        await GoogleAuth.signOut();
        return { ok: true };
    } catch (error) {
        console.warn('[GoogleAuth] signOut error:', error);
        return { ok: false, error };
    }
}

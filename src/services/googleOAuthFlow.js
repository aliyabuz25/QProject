import { auth } from './api.js';
import { googleSignIn } from './googleAuth.js';

const GOOGLE_PASSWORD_PREFIX = 'Google-Cloud_Pass';

function getSocialFlag(data, key) {
    if (!data || typeof data !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(data, key)) return Boolean(data[key]);
    if (data.data && typeof data.data === 'object' && Object.prototype.hasOwnProperty.call(data.data, key)) {
        return Boolean(data.data[key]);
    }
    return undefined;
}

function fallbackHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0').repeat(4);
}

async function sha256Hex(value) {
    if (!globalThis.crypto?.subtle) return fallbackHash(value);
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function nameFromEmail(email) {
    const localPart = email.split('@')[0] || 'Google';
    const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
    return cleaned || 'Google';
}

function compatibilityPhoneFromDigest(digest) {
    const digits = Array.from(digest)
        .map(character => String(Number.parseInt(character, 16) % 10))
        .join('');
    const firstSubscriberDigit = String((Number(digits[0] || 0) % 8) + 2);
    return `+1${firstSubscriberDigit}${digits.slice(1, 10).padEnd(9, '0')}`;
}

async function createCompatibilityCredentials(googleResult) {
    const email = String(googleResult.email || '').trim().toLowerCase();
    const googleId = String(googleResult.id || '').trim();
    if (!email || !googleId) {
        return null;
    }

    const digest = await sha256Hex(`${GOOGLE_PASSWORD_PREFIX}\u0000${googleId}\u0000${email}`);
    const displayFallback = nameFromEmail(email);

    return {
        email,
        password: `${GOOGLE_PASSWORD_PREFIX}_${digest.slice(0, 32)}`,
        firstName: googleResult.givenName || displayFallback,
        lastName: googleResult.familyName || 'Google',
        // Keep the legacy bridge compatible with normal registration validators.
        // It is deterministic per Google account and has a valid E.164 shape.
        phoneNumber: compatibilityPhoneFromDigest(digest),
    };
}

/**
 * Runs native Google account selection. A verified ID-token exchange is used
 * when the backend supports it; otherwise the current backend is bridged via a
 * Google-account-specific email/password registration and login.
 */
export async function signInWithGoogleOAuth() {
    const googleResult = await googleSignIn();

    if (!googleResult.ok) return googleResult;
    if (!googleResult.email) {
        return {
            ok: false,
            error: 'Google Sign-In did not return an email address. Please try again.',
            status: 400,
        };
    }

    const profile = {
        email: googleResult.email,
        firstName: googleResult.givenName,
        lastName: googleResult.familyName,
        name: googleResult.displayName,
        displayName: googleResult.displayName,
        photoUrl: googleResult.photoUrl,
        googleId: googleResult.id,
        providerUserId: googleResult.id,
    };

    if (googleResult.idToken) {
        const socialResult = await auth.socialLogin('google', googleResult.idToken, profile);
        if (socialResult.ok || ![404, 405].includes(socialResult.status)) {
            return {
                ...socialResult,
                googleUser: googleResult,
                isNewUser: getSocialFlag(socialResult.data, 'isNewUser'),
            };
        }
    }

    const credentials = await createCompatibilityCredentials(googleResult);
    if (!credentials) {
        return {
            ok: false,
            error: 'Google account information is incomplete. Please try another account.',
            status: 400,
        };
    }
    const result = await auth.googleEmailLoginOrRegister(credentials, profile);

    return {
        ...result,
        googleUser: googleResult,
        isNewUser: result.isNewUser ?? getSocialFlag(result.data, 'isNewUser'),
    };
}

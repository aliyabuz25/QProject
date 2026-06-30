import { Capacitor, registerPlugin } from '@capacitor/core';

const SETTING_KEY = 'kidsbible_notifications_enabled';
const FOREGROUND_CHECK_INTERVAL_MS = 60_000;
const BackgroundNotifications = registerPlugin('BackgroundNotifications');

let foregroundTimer = null;

export function areBackgroundNotificationsEnabled() {
    const stored = localStorage.getItem(SETTING_KEY);
    return stored === null ? true : stored === 'true';
}

export async function initializeBackgroundNotifications() {
    if (!Capacitor.isNativePlatform()) return;

    const enabled = areBackgroundNotificationsEnabled();
    if (localStorage.getItem(SETTING_KEY) === null) {
        localStorage.setItem(SETTING_KEY, 'true');
    }

    try {
        await BackgroundNotifications.configure({ enabled });
        updateForegroundTimer(enabled);
    } catch (error) {
        console.error('[NOTIFICATIONS] Native initialization failed:', error);
    }
}

export async function setBackgroundNotificationsEnabled(enabled) {
    localStorage.setItem(SETTING_KEY, String(enabled));
    updateForegroundTimer(enabled);

    if (!Capacitor.isNativePlatform()) return;
    await BackgroundNotifications.configure({ enabled });
}

function updateForegroundTimer(enabled) {
    if (foregroundTimer !== null) {
        clearInterval(foregroundTimer);
        foregroundTimer = null;
    }

    if (!enabled || !Capacitor.isNativePlatform()) return;
    foregroundTimer = setInterval(() => {
        if (document.visibilityState !== 'hidden') {
            BackgroundNotifications.checkNow().catch((error) => {
                console.warn('[NOTIFICATIONS] Foreground check failed:', error);
            });
        }
    }, FOREGROUND_CHECK_INTERVAL_MS);
}

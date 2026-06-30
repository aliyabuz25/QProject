import { auth } from '../services/api.js';

/**
 * Get the display name from the logged-in user.
 * Tries firstName + lastName, then name, then email prefix, then fallback.
 */
function getUserDisplayName() {
    const user = auth.getUser();
    if (!user) return 'Guest';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.name) return user.name;
    if (user.fullName) return user.fullName;
    if (user.email) return user.email.split('@')[0];
    return 'Guest';
}

class AppState {
    constructor() {
        this.user = {
            get name() {
                return getUserDisplayName();
            },
            avatar: '/assets/images/avatar-memoji.png'
        };
        this.activeProduct = null;
        this.activeTrack = null;
        this.audioTracks = [];
        this.activeVideo = null;
        this.activeFavoritesTab = 'audio';
    }

    setActiveProduct(product) {
        this.activeProduct = product;
    }

    setActiveTrack(track) {
        this.activeTrack = track;
    }

    setAudioTracks(tracks) {
        this.audioTracks = Array.isArray(tracks) ? tracks : [];
    }

    setActiveVideo(video) {
        this.activeVideo = video;
    }

    setActiveFavoritesTab(tab) {
        this.activeFavoritesTab = tab;
    }
}

export const state = new AppState();

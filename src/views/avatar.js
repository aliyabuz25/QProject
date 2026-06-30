/**
 * Avatar selection screen
 * Figma: "Change Your Avatar" frame
 * Source: Figma file caVV6rxU4vHZjILKNKMY5F
 * Component set: "Avatars (Memoji)" — 1:558
 *
 * Layout:
 *   - Title: "Change Your Avatar"
 *   - Subtitle: "Pick an avatar to personalize your profile."
 *   - Large selected avatar preview (centered, ~120px circle)
 *   - 3-column avatar grid (9 avatars, no labels)
 *   - Selected: yellow border + gold checkmark badge
 *   - Bottom: Cancel (secondary) + Submit (primary yellow) buttons
 */
export function renderAvatar() {
    const container = document.createElement('div');
    container.className = 'screen bg-[#0d0d0d] text-white font-baloo flex flex-col w-full';
    container.style.cssText = 'position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-top:max(env(safe-area-inset-top,0px),24px);';

    // Real Figma Memoji avatars — exported from component set 1:558
    // avatar-0 = Empty/Default (gray placeholder), avatar-1..8 = memoji faces
    const avatars = [
        { id: 'avatar-0', image: '/assets/images/avatars/avatar-0.png' },
        { id: 'avatar-1', image: '/assets/images/avatars/avatar-1.png' },
        { id: 'avatar-2', image: '/assets/images/avatars/avatar-2.png' },
        { id: 'avatar-3', image: '/assets/images/avatars/avatar-3.png' },
        { id: 'avatar-4', image: '/assets/images/avatars/avatar-4.png' },
        { id: 'avatar-5', image: '/assets/images/avatars/avatar-5.png' },
        { id: 'avatar-6', image: '/assets/images/avatars/avatar-6.png' },
        { id: 'avatar-7', image: '/assets/images/avatars/avatar-7.png' },
        { id: 'avatar-8', image: '/assets/images/avatars/avatar-8.png' },
    ];

    // Default selected: avatar-1 (purple-haired girl, matches Figma)
    const savedSrc = localStorage.getItem('selectedAvatar');
    const savedAvatar = savedSrc ? avatars.find(a => a.image === savedSrc) : null;
    let selectedId = savedAvatar ? savedAvatar.id : 'avatar-1';

    const CHECK_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5L4.5 7.5L8.5 2.5" stroke="#1b1b1b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const render = () => {
        const selectedAvatar = avatars.find(a => a.id === selectedId) || avatars[1];

        container.innerHTML = `
            <!-- Header -->
            <div class="flex flex-col px-4 pt-2 pb-0" style="gap: 4px;">
                <h1 class="font-semibold text-[28px] leading-[40px] text-white m-0 font-baloo text-center">Change Your Avatar</h1>
                <p class="font-normal text-[14px] leading-[20px] text-[#74797f] m-0 font-baloo text-center">Pick an avatar to personalize your profile.</p>
            </div>

            <!-- Large selected avatar preview -->
            <div class="flex justify-center items-center" style="padding: 28px 0 20px 0;">
                <div class="rounded-full overflow-hidden bg-[#1a1a1a]"
                     style="width: 120px; height: 120px; border: 3px solid #fec348;">
                    <img id="preview-img"
                         src="${selectedAvatar.image}"
                         alt="Selected avatar"
                         class="w-full h-full object-cover" />
                </div>
            </div>

            <!-- Avatar grid — 3 columns, no labels -->
            <div class="flex-1 overflow-y-auto px-4" style="padding-bottom: 16px;">
                <div class="grid grid-cols-3 gap-4 w-full">
                    ${avatars.map(avatar => {
                        const isSelected = selectedId === avatar.id;
                        return `
                            <div class="flex items-center justify-center cursor-pointer"
                                 data-avatar-id="${avatar.id}"
                                 role="button"
                                 aria-pressed="${isSelected}">
                                <div class="relative">
                                    <div class="rounded-full overflow-hidden bg-[#1a1a1a]"
                                         style="width: 88px; height: 88px; border: ${isSelected ? '2.5px solid #fec348' : '2px solid #2a2a2a'};">
                                        <img src="${avatar.image}"
                                             alt="Avatar"
                                             class="w-full h-full object-cover pointer-events-none" />
                                    </div>
                                    ${isSelected ? `
                                        <div class="absolute flex items-center justify-center bg-[#fec348] rounded-full"
                                             style="width: 22px; height: 22px; bottom: 0; right: 0; border: 2px solid #0d0d0d;">
                                            ${CHECK_SVG}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Bottom Button Group: Cancel + Submit -->
            <div class="flex flex-row gap-3 px-4 pt-3"
                 style="padding-bottom: max(env(safe-area-inset-bottom, 0px), 24px);">
                <!-- Cancel — secondary, dark bg, white border -->
                <button id="cancel-btn"
                        class="flex-1 flex items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-[32px] cursor-pointer ripple"
                        style="height: 56px;">
                    <span class="font-baloo font-medium text-[16px] leading-[24px] text-white">Cancel</span>
                </button>
                <!-- Submit — primary, yellow -->
                <button id="submit-btn"
                        class="flex-1 flex items-center justify-center bg-[#fec348] rounded-[32px] border-none cursor-pointer ripple"
                        style="height: 56px;">
                    <span class="font-baloo font-semibold text-[16px] leading-[24px] text-[#1b1b1b]">Submit</span>
                </button>
            </div>
        `;

        // Avatar selection — tap to select
        container.querySelectorAll('[data-avatar-id]').forEach(el => {
            el.addEventListener('click', () => {
                selectedId = el.dataset.avatarId;
                render();
            });
        });

        // Cancel — go back to profile
        container.querySelector('#cancel-btn').addEventListener('click', () => {
            window.location.hash = '#profile';
        });

        // Submit — save selection, update live avatar images, go back
        container.querySelector('#submit-btn').addEventListener('click', () => {
            const chosen = avatars.find(a => a.id === selectedId) || avatars[1];
            localStorage.setItem('selectedAvatar', chosen.image);

            // Update any live avatar img elements on other screens
            document.querySelectorAll('#home-avatar-img, #settings-avatar-img').forEach(img => {
                img.src = chosen.image;
            });

            window.location.hash = '#profile';
        });
    };

    render();
    return container;
}
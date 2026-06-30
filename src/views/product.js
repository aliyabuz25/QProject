import { navigate } from '../js/router.js';
import { isFavorite, toggleFavorite } from '../services/favoritesService.js';
import { state } from '../state/appState.js';

export function renderProduct() {
    const product = state.activeProduct ?? {
        title: 'Kids Bible Stories',
        category: 'Old Testament',
        catColor: '#9747ff',
        image: '/assets/images/books/ot-isaiah.png',
        websiteUrl: 'https://thekidsbiblestories.com/products/kids-bible-stories-old-testament',
        stories: '25+',
        ages: '3-12',
        pages: '15'
    };
    // Root: full screen, overflow hidden — no double scroll
    const container = document.createElement('div');
    container.style.cssText = [
        'position:absolute',
        'inset:0',
        'height:100dvh',
        'background:#0D0D0D',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'color:#ffffff',
        'font-family:"Baloo 2",sans-serif',
    ].join(';');

    // ─── FIXED HEADER ─────────────────────────────────────────────────────────
    // height = safe-area-inset-top + 64px
    const header = document.createElement('div');
    header.style.cssText = [
        'position:relative',
        'flex-shrink:0',
        'width:100%',
        'height:calc(env(safe-area-inset-top,0px) + 64px)',
        'background:#0D0D0D',
        'z-index:50',
        'box-sizing:border-box',
    ].join(';');

    // Back button: left:16px, top: safe-area + 9px
    const backBtn = document.createElement('button');
    backBtn.style.cssText = [
        'position:absolute',
        'left:16px',
        'top:calc(env(safe-area-inset-top,0px) + 9px)',
        'width:44px',
        'height:44px',
        'border-radius:100px',
        'background:#292929',
        'border:none',
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'padding:0',
    ].join(';');
    backBtn.setAttribute('aria-label', 'Back to Shop');
    backBtn.onclick = () => navigate('#shop');
    backBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // Title: centered in the 64px row below safe-area
    const titleEl = document.createElement('h1');
    titleEl.style.cssText = [
        'position:absolute',
        'left:0',
        'right:0',
        'top:env(safe-area-inset-top,0px)',
        'height:64px',
        'margin:0',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'font-family:"Baloo 2",sans-serif',
        'font-weight:500',
        'font-size:28px',
        'line-height:26px',
        'color:#ffffff',
        'text-align:center',
        'pointer-events:none',
    ].join(';');
    titleEl.textContent = 'Shop';

    header.appendChild(backBtn);
    header.appendChild(titleEl);
    container.appendChild(header);

    // ─── SCROLLABLE CONTENT ───────────────────────────────────────────────────
    // height = 100dvh - (safe-area + 64px)
    const scrollArea = document.createElement('div');
    scrollArea.style.cssText = [
        'height:calc(100dvh - (env(safe-area-inset-top,0px) + 64px))',
        'overflow-y:auto',
        'overflow-x:hidden',
        '-webkit-overflow-scrolling:touch',
        'padding:30px 16px calc(env(safe-area-inset-bottom,0px) + 24px)',
        'box-sizing:border-box',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'gap:30px',
    ].join(';');

    // ─── IMAGE SECTION ────────────────────────────────────────────────────────
    const imageSection = document.createElement('div');
    imageSection.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'gap:8px',
        'width:162px',
    ].join(';');

    const imgWrapper = document.createElement('div');
    imgWrapper.style.cssText = [
        'width:162px',
        'height:216px',
        'overflow:hidden',
        'border-radius:8px',
        'background:#1b1b1b',
    ].join(';');

    const productImg = document.createElement('img');
    productImg.src = product.image;
    productImg.alt = product.title;
    productImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

    imgWrapper.appendChild(productImg);
    imageSection.appendChild(imgWrapper);

    // Carousel dots
    const dots = document.createElement('div');
    dots.style.cssText = 'display:flex;align-items:center;gap:12px;';
    dots.innerHTML = `
        <div style="width:8px;height:8px;border-radius:50%;background:#FFD66B;"></div>
        <div style="width:8px;height:8px;border-radius:50%;background:#686C75;"></div>
        <div style="width:8px;height:8px;border-radius:50%;background:#686C75;"></div>
    `;
    imageSection.appendChild(dots);
    scrollArea.appendChild(imageSection);

    // ─── INFO + ACTIONS ───────────────────────────────────────────────────────
    const infoActions = document.createElement('div');
    infoActions.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'width:100%',
        'max-width:362px',
        'gap:67px',
    ].join(';');

    // Details: copy + stats
    const details = document.createElement('div');
    details.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'gap:36px',
        'width:100%',
    ].join(';');

    // Title + description
    const copyBlock = document.createElement('div');
    copyBlock.style.cssText = 'display:flex;flex-direction:column;width:100%;';
    copyBlock.innerHTML = `
        <h2 style="margin:0;font-family:'Baloo 2',sans-serif;font-weight:600;font-size:32px;line-height:48px;color:#ffffff;width:100%;word-break:break-word;">${product.title}</h2>
        <p style="margin:0;font-family:'Baloo 2',sans-serif;font-weight:400;font-size:16px;line-height:20px;color:${product.catColor};width:100%;word-break:break-word;">${product.category}</p>
    `;
    details.appendChild(copyBlock);

    // Stats card — width:362px, height:108px
    const statsCard = document.createElement('div');
    statsCard.style.cssText = [
        'background:rgba(27,27,27,0.75)',
        'border-radius:12px',
        'padding:8px',
        'display:flex',
        'flex-direction:row',
        'align-items:center',
        'justify-content:space-between',
        'width:100%',
        'height:108px',
        'box-sizing:border-box',
    ].join(';');

    const stats = [
        {
            value: product.stories,
            label: 'Stories',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#fec348" stroke-width="1.5" stroke-linecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#fec348" stroke-width="1.5"/></svg>`
        },
        {
            value: `Ages ${product.ages}`,
            label: 'Perfect for kids',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fec348" stroke-width="1.5"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#fec348" stroke-width="1.5" stroke-linecap="round"/></svg>`
        },
        {
            value: product.pages,
            label: 'Pages',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#fec348" stroke-width="1.5"/><polyline points="14 2 14 8 20 8" stroke="#fec348" stroke-width="1.5"/></svg>`
        }
    ];

    stats.forEach(stat => {
        const col = document.createElement('div');
        col.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'justify-content:center',
            'gap:12px',
            'flex:1',
        ].join(';');
        col.innerHTML = `
            <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">${stat.icon}</div>
            <div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
                <span style="font-family:'Baloo 2',sans-serif;font-weight:400;font-size:14px;line-height:16px;color:#ffffff;">${stat.value}</span>
                <span style="font-family:'Baloo 2',sans-serif;font-weight:400;font-size:16px;line-height:20px;color:#6e6e6e;white-space:nowrap;">${stat.label}</span>
            </div>
        `;
        statsCard.appendChild(col);
    });

    details.appendChild(statsCard);
    infoActions.appendChild(details);

    // Actions
    const actions = document.createElement('div');
    actions.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'gap:12px',
        'width:100%',
    ].join(';');

    const btnWebsite = document.createElement('button');
    btnWebsite.style.cssText = [
        'background:#FEC348',
        'border-radius:32px',
        'height:56px',
        'width:100%',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'gap:12px',
        'border:none',
        'cursor:pointer',
        'padding:0 16px',
        'box-sizing:border-box',
    ].join(';');
    btnWebsite.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="15 3 21 3 21 9" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="10" y1="14" x2="21" y2="3" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="font-family:'Poppins',sans-serif;font-weight:500;font-size:16px;line-height:20px;color:#1b1b1b;">View on website</span>
    `;
    btnWebsite.onclick = () => {
        if (!product.websiteUrl) return;
        window.open(product.websiteUrl, '_blank', 'noopener,noreferrer');
    };

    const btnFav = document.createElement('button');
    btnFav.style.cssText = [
        'background:transparent',
        'border:1px solid #303030',
        'border-radius:32px',
        'height:56px',
        'width:100%',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'gap:10px',
        'cursor:pointer',
        'padding:10px',
        'box-sizing:border-box',
    ].join(';');
    const favoriteItem = {
        ...product,
        id: String(product.id ?? product.title),
        type: 'shop',
        subtitle: product.category,
        time: `${product.pages} Pages`,
    };

    function updateFavoriteButton() {
        const favorite = isFavorite(favoriteItem.id, 'shop');
        btnFav.setAttribute('aria-label', favorite ? 'Remove from favorites' : 'Add to favorites');
        btnFav.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      ${favorite ? 'fill="#FEC348" stroke="#FEC348"' : 'stroke="white"'} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="font-family:'Poppins',sans-serif;font-weight:500;font-size:16px;line-height:20px;color:#ffffff;white-space:nowrap;">${favorite ? 'Added to Favorites' : 'Add to Favorites'}</span>
        `;
    }

    btnFav.onclick = () => {
        toggleFavorite(favoriteItem);
        state.setActiveFavoritesTab('shop');
        updateFavoriteButton();
    };
    updateFavoriteButton();

    actions.appendChild(btnWebsite);
    actions.appendChild(btnFav);
    infoActions.appendChild(actions);

    scrollArea.appendChild(infoActions);
    container.appendChild(scrollArea);

    return container;
}

function shouldEagerLoad(img, index, eagerSelectors, eagerCount) {
    if (img?.dataset?.eager === 'true') return true;
    if (index < eagerCount) return true;

    return eagerSelectors.some(selector => {
        try {
            return img.matches(selector);
        } catch {
            return false;
        }
    });
}

export function optimizeImage(img, { eager = false } = {}) {
    if (!img || img.dataset.kbsImageOptimized === 'true') return img;

    img.dataset.kbsImageOptimized = 'true';
    img.decoding = eager ? 'sync' : 'async';
    img.loading = eager ? 'eager' : 'lazy';

    if ('fetchPriority' in img) {
        img.fetchPriority = eager ? 'high' : 'low';
    }

    img.setAttribute('draggable', 'false');

    if (!eager && !img.complete) {
        img.style.opacity = img.style.opacity || '0';
        img.style.transition = img.style.transition
            ? `${img.style.transition}, opacity 160ms ease-out`
            : 'opacity 160ms ease-out';

        const reveal = () => {
            img.style.opacity = '1';
        };

        img.addEventListener('load', reveal, { once: true });
        img.addEventListener('error', reveal, { once: true });
    }

    return img;
}

export function optimizeImages(root, { eagerSelectors = [], eagerCount = 8 } = {}) {
    if (!root) return root;

    const images = Array.from(root.querySelectorAll('img'));
    images.forEach((img, index) => {
        optimizeImage(img, {
            eager: shouldEagerLoad(img, index, eagerSelectors, eagerCount),
        });
    });

    return root;
}

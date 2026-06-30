export function createCategoryCard(data, href = '#books') {
    return `
        <div class="cat-item" onclick="window.location.hash='${href}'">
            <div class="cat-circle-wrap">
                <div class="cat-circle-inner">
                    <img src="${data.image}">
                </div>
            </div>
            <div class="cat-title-container">
                <span class="cat-title">${data.title.replace(' ', '<br>')}</span>
                <span class="cat-subtitle">${data.count} books</span>
            </div>
        </div>
        <style>
            .cat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                width: 104px; /* Exact Figma bounding box for categories */
                flex-shrink: 0;
                cursor: pointer;
            }
            .cat-circle-wrap {
                width: 100px; /* Exact outer hit area */
                height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cat-circle-inner {
                width: 70px; /* The visible circular image */
                height: 70px;
                border-radius: 100px;
                overflow: hidden;
                position: relative;
            }
            .cat-circle-inner img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: absolute;
            }
            .cat-title-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 2px;
            }
            .cat-title {
                font-family: 'Baloo 2';
                font-weight: 500;
                font-size: 16px;
                line-height: 20px;
                color: white;
            }
            .cat-subtitle {
                font-family: 'Baloo 2';
                font-weight: 400;
                font-size: 12px;
                line-height: 16px;
                color: #adb5bd;
            }
        </style>
    `;
}

export function createVerticalCard(data, customClass = '') {
    return `
        <div class="card-vert ${customClass}" onclick="window.location.hash='#player'">
            <img src="${data.image}">
            <div class="card-vert-play">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.25 20.4852V3.51478C5.25 2.50284 6.38604 1.91617 7.22896 2.49397L19.5938 10.9792C20.2926 11.4586 20.2926 12.5414 19.5938 13.0208L7.22896 21.506C6.38604 22.0838 5.25 21.4972 5.25 20.4852Z" fill="white"/>
                </svg>
            </div>
        </div>
        <style>
            .card-vert {
                width: 127px;
                height: 190px;
                border-radius: 12px; /* Figma standard for these cards */
                border: none; /* Removing previous grey border */
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
                cursor: pointer;
            }
            .card-vert.grid-size {
                width: 112px;
                height: 168px;
            }
            .card-vert img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .card-vert-play {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px; /* Fixed height to 40 */
                background: rgba(0,0,0,0.4);
                backdrop-filter: blur(4px);
                border-radius: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding-left: 2px; /* visual center for play icon */
            }
        </style>
    `;
}

export function createHorizontalCard(data) {
    const badgeClass = data.badgeColor === 'orange' ? 'badge-orange' : 'badge-purple';
    return `
        <div class="card-horiz" onclick="window.location.hash='#player'">
            <div class="card-horiz-img">
                <img src="${data.image}">
            </div>
            <div class="card-horiz-info">
                <div class="card-horiz-title-group">
                    <h3 class="card-horiz-title">${data.title}</h3>
                    <span class="audio-badge ${badgeClass}">${data.category}</span>
                </div>
                <div class="card-horiz-meta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="#6e6e6e" stroke-width="1.5"/>
                        <path d="M12 6V12L16 16" stroke="#6e6e6e" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>${data.duration}</span>
                </div>
            </div>
            <div class="card-horiz-play">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.25 20.4852V3.51478C5.25 2.50284 6.38604 1.91617 7.22896 2.49397L19.5938 10.9792C20.2926 11.4586 20.2926 12.5414 19.5938 13.0208L7.22896 21.506C6.38604 22.0838 5.25 21.4972 5.25 20.4852Z" fill="white"/>
                </svg>
            </div>
        </div>
        <style>
            .card-horiz {
                background: transparent; /* Updated from #121212 per standard Figma spec */
                border: none;
                border-radius: 0;
                padding: 8px 0; /* Align perfectly with layout padding */
                display: flex;
                align-items: center;
                gap: 16px;
                cursor: pointer;
            }
            .card-horiz-img {
                width: 80px;
                height: 89px;
                border-radius: 12px;
                overflow: hidden;
                flex-shrink: 0;
            }
            .card-horiz-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .card-horiz-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .card-horiz-title-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .card-horiz-title {
                font-family: 'Baloo 2';
                font-weight: 500; /* Match title weight from spec */
                font-size: 16px;
                color: white;
                margin: 0;
            }
            .audio-badge {
                align-self: flex-start;
                padding: 2px 8px;
                border-radius: 32px;
                font-family: 'Baloo 2';
                font-weight: 500;
                font-size: 10px;
            }
            .badge-purple {
                background: rgba(151,71,255,0.2);
                color: #d8b4fe;
            }
            .badge-orange {
                background: rgba(255, 117, 71, 0.2);
                color: #ffb399;
            }

            .card-horiz-meta {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .card-horiz-meta span {
                font-family: 'Baloo 2';
                font-size: 12px;
                color: #838383;
            }
            .card-horiz-play {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                padding-left: 2px;
            }
        </style>
    `;
}
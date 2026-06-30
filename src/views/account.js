import { auth, subscriptionApi } from '../services/api.js';
import { navigate } from '../js/router.js';

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export function renderAccount() {
    const user = auth.getUser() || {};
    const uid = auth.getUserId();
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
        || user.name
        || user.fullName
        || 'Account';

    const container = document.createElement('div');
    container.style.cssText = [
        'width:100%;height:100dvh;background:#0D0D0D;color:#FFFFFF;',
        'display:flex;flex-direction:column;overflow:hidden;',
        'font-family:"Baloo 2",sans-serif;',
    ].join('');

    const header = document.createElement('div');
    header.style.cssText = [
        'display:flex;align-items:center;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;',
        'flex-shrink:0;',
    ].join('');
    header.innerHTML = `
        <button type="button" aria-label="Back to profile" style="width:44px;height:44px;border-radius:50%;border:none;background:#292929;color:white;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1 style="font-size:24px;line-height:32px;font-weight:600;text-align:center;flex:1;margin:0;">Account</h1>
        <div style="width:44px;height:44px;"></div>
    `;
    header.querySelector('button').addEventListener('click', () => navigate('#profile'));
    container.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = 'flex:1;overflow-y:auto;padding:8px 16px calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:16px;';
    container.appendChild(content);

    const profileCard = document.createElement('section');
    profileCard.style.cssText = 'background:#131313;border:1px solid #1F1F1F;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;';
    const profileTitle = document.createElement('h2');
    profileTitle.textContent = 'Profile details';
    profileTitle.style.cssText = 'font-size:18px;line-height:28px;font-weight:600;margin:0;';
    profileCard.appendChild(profileTitle);

    function addField(label, value) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;gap:16px;padding-bottom:10px;border-bottom:1px solid #242424;';
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size:14px;color:#7D848C;';
        const valueEl = document.createElement('span');
        valueEl.textContent = value || 'Not provided';
        valueEl.style.cssText = 'font-size:14px;color:#DEE2E6;text-align:right;overflow-wrap:anywhere;';
        row.append(labelEl, valueEl);
        profileCard.appendChild(row);
    }

    addField('Name', name);
    addField('Email', user.email);
    addField('Phone', user.phoneNumber || user.phone);
    if (uid !== null && uid !== undefined) addField('User ID', String(uid));
    content.appendChild(profileCard);

    const subscriptionCard = document.createElement('section');
    subscriptionCard.style.cssText = 'background:#131313;border:1px solid #1F1F1F;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;';
    subscriptionCard.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <h2 style="font-size:18px;line-height:28px;font-weight:600;margin:0;">Subscription</h2>
            <span id="account-sub-badge" style="font-size:12px;line-height:18px;padding:4px 10px;border-radius:20px;background:#292929;color:#ADB5BD;">Checking</span>
        </div>
        <p id="account-sub-message" style="font-size:14px;line-height:20px;color:#7D848C;margin:0;">Checking your subscription status...</p>
        <button id="account-manage-subscription" type="button" style="width:100%;height:48px;border-radius:28px;border:none;background:#FEC348;color:#0D0D0D;font:600 16px 'Baloo 2',sans-serif;cursor:pointer;">Manage subscription</button>
    `;
    content.appendChild(subscriptionCard);

    subscriptionCard.querySelector('#account-manage-subscription').addEventListener('click', () => {
        try { sessionStorage.setItem('kidsbible_subscription_return', '#account'); } catch {}
        navigate('#subscription');
    });

    const badge = subscriptionCard.querySelector('#account-sub-badge');
    const message = subscriptionCard.querySelector('#account-sub-message');

    if (uid === null || uid === undefined) {
        badge.textContent = 'Unavailable';
        message.textContent = 'Sign in again to load your subscription.';
    } else {
        subscriptionApi.check(uid).then(result => {
            if (!result.ok) {
                badge.textContent = 'Unavailable';
                message.textContent = result.error;
                return;
            }

            const subscription = result.data || {};
            const active = subscription.status === 'active';
            badge.textContent = active ? 'Active' : 'Inactive';
            badge.style.background = active ? 'rgba(63,156,53,0.18)' : '#292929';
            badge.style.color = active ? '#65C95A' : '#ADB5BD';
            message.textContent = active
                ? `Your access is active until ${formatDate(subscription.subscriptionEndDate) || 'the renewal date'}.`
                : (subscription.message || 'No active subscription was found.');
            try { localStorage.setItem('kidsbible_subscription', JSON.stringify(subscription)); } catch {}
        });
    }

    return container;
}

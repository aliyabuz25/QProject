import { navigate } from '../js/router.js';
import { auth, subscriptionApi } from '../services/api.js';

const SUBSCRIPTION_PLANS = {
    monthly: {
        productId: 'premium_access_monthly',
        amount: 9.99,
        currency: 'USD',
        label: 'Monthly',
    },
    annual: {
        productId: 'premium_access_annual',
        amount: 83.99,
        currency: 'USD',
        label: 'Annual',
    },
};

function getSubscriptionEndDate(plan) {
    const endDate = new Date();
    if (plan === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);
    return endDate.toISOString();
}

/**
 * Subscription / Pick Your Plan — Figma 108:3165
 *
 * Frame: 393×852, bg #000409
 * Layout: fixed single-screen paywall, NO scroll.
 *
 * The router strips position/inset/overflow-y from the returned element.
 * Solution: return a neutral outer wrapper; put the real fixed layout on
 * an inner child that the router cannot touch.
 *
 * 3-zone flex column (inside inner):
 *   1. Header zone (flex:0): back btn + title + subtitle
 *   2. Plans zone (flex:1, justify-content:center): monthly + annual cards
 *   3. CTA zone (flex:0): Start 7-Day Free Trial btn + bonus text
 */
export function renderSubscription() {
    let selectedPlan = 'monthly';
    let subscriptionIsActive = false;
    // Outer wrapper — router strips position/inset/overflow-y from THIS element
    const el = document.createElement('div');
    el.style.cssText = 'width:100%;height:100dvh;overflow:hidden;';

    // Inner wrapper — fills the outer, flex column layout, no scroll
    const inner = document.createElement('div');
    inner.style.cssText = [
        'position:relative;',
        'width:100%;',
        'height:100dvh;',
        'background:#000409;',
        'display:flex;',
        'flex-direction:column;',
        'box-sizing:border-box;',
        'padding:calc(env(safe-area-inset-top,0px) + 120px) 16px calc(env(safe-area-inset-bottom,0px) + 16px) 16px;',
        'overflow:hidden;',
    ].join('');
    el.appendChild(inner);

    // ── Back button (108:3215) — absolutely positioned: left 16px, top 67px ──
    const btnBack = document.createElement('button');
    btnBack.setAttribute('aria-label', 'Go back');
    btnBack.style.cssText = [
        'position:absolute;',
        'left:16px;',
        'top:67px;',
        'width:44px;height:44px;',
        'border-radius:100px;border:none;cursor:pointer;',
        'background:rgba(41,41,41,0.81);',
        'display:flex;align-items:center;justify-content:center;',
        'box-sizing:border-box;padding:8px;',
        '-webkit-tap-highlight-color:transparent;',
        'z-index:10;',
    ].join('');
    btnBack.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 19.5L7.5 12L15 4.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btnBack.addEventListener('click', () => {
        let returnRoute = '#onboarding';
        try {
            returnRoute = sessionStorage.getItem('kidsbible_subscription_return') || returnRoute;
            sessionStorage.removeItem('kidsbible_subscription_return');
        } catch {}
        navigate(returnRoute);
    });
    inner.appendChild(btnBack);

    // ── Header zone: title + subtitle ────────────────────────────────────────
    const headerZone = document.createElement('div');
    headerZone.style.cssText = [
        'flex-shrink:0;',
        'display:flex;flex-direction:column;gap:8px;',
        'margin-bottom:16px;',
    ].join('');
    headerZone.innerHTML = `
        <h1 style="
            font-family:'Baloo 2',sans-serif;
            font-weight:600;font-size:32px;line-height:48px;
            color:#FFFFFF;margin:0;padding:0;text-align:center;
        ">Pick your Plan</h1>
        <p style="
            font-family:'Baloo 2',sans-serif;
            font-weight:400;font-size:18px;line-height:28px;
            color:#9B9B9B;margin:0;padding:0;text-align:center;
        ">Unlimited Bible Stories,<br>Audio Stories &amp; Bedtime Content.</p>`;
    inner.appendChild(headerZone);

    const statusMessage = document.createElement('p');
    statusMessage.setAttribute('role', 'status');
    statusMessage.style.cssText = [
        'display:none;margin:0 0 8px;padding:8px 12px;border-radius:10px;',
        'font-family:"Baloo 2",sans-serif;font-size:13px;line-height:18px;text-align:center;',
        'background:#181818;color:#ADB5BD;',
    ].join('');
    inner.appendChild(statusMessage);

    function showStatus(message, tone = 'neutral') {
        statusMessage.textContent = message;
        statusMessage.style.display = 'block';
        statusMessage.style.color = tone === 'success' ? '#65C95A' : tone === 'error' ? '#FF7B72' : '#ADB5BD';
        statusMessage.style.border = tone === 'success'
            ? '1px solid rgba(101,201,90,0.25)'
            : tone === 'error'
                ? '1px solid rgba(255,123,114,0.25)'
                : '1px solid #242424';
    }

    // ── Plans zone (flex:1) ───────────────────────────────────────────────────
    const plansZone = document.createElement('div');
    plansZone.style.cssText = [
        'flex:1 1 auto;',
        'display:flex;flex-direction:column;',
        'justify-content:center;',
        'gap:16px;',
        'min-height:0;',
    ].join('');
    inner.appendChild(plansZone);

    // ── Monthly card (108:3175) ───────────────────────────────────────────────
    const cardMonthly = document.createElement('div');
    cardMonthly.style.cssText = [
        'display:flex;flex-direction:column;gap:12px;',
        'background:#181818;border-radius:20px;padding:12px;',
        'border:0.5px solid #FEC348;cursor:pointer;',
        'box-shadow:0px 20px 20px 0px rgba(131,78,216,0.05);',
        'box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;',
    ].join('');

    const monthlyTop = document.createElement('div');
    monthlyTop.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding-bottom:12px;border-bottom:1px solid #323232;';

    const monthlyRow = document.createElement('div');
    monthlyRow.style.cssText = 'display:flex;flex-direction:row;justify-content:space-between;align-items:center;';
    monthlyRow.innerHTML = `
        <span style="font-family:'Baloo 2',sans-serif;font-weight:600;font-size:24px;line-height:32px;color:#FFFFFF;">Monthly plan</span>
        <div style="display:flex;flex-direction:row;align-items:center;gap:12px;">
            <span style="
                font-family:'Poppins',sans-serif;font-weight:400;font-size:12px;line-height:16px;
                color:#FFFFFF;background:#FEC348;border-radius:24px;
                padding:6px 10px;white-space:nowrap;height:24px;
                display:flex;align-items:center;box-sizing:border-box;
            ">Popular</span>
            <div id="radio-monthly" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#FEC348" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="#FEC348"/></svg>
            </div>
        </div>`;
    monthlyTop.appendChild(monthlyRow);

    const monthlyPrice = document.createElement('div');
    monthlyPrice.style.cssText = 'display:flex;flex-direction:row;align-items:baseline;gap:4px;';
    monthlyPrice.innerHTML = `
        <span style="font-family:'Baloo 2',sans-serif;font-weight:500;font-size:24px;line-height:32px;color:#FEC348;">$9.99</span>
        <span style="font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;color:#ABABAB;">monthly</span>`;
    monthlyTop.appendChild(monthlyPrice);
    cardMonthly.appendChild(monthlyTop);

    const monthlyDesc = document.createElement('p');
    monthlyDesc.style.cssText = "font-family:'Poppins',sans-serif;font-weight:400;font-size:14px;line-height:20px;color:#949494;margin:0;padding:0;";
    monthlyDesc.textContent = 'This helps us create the right learning path.';
    cardMonthly.appendChild(monthlyDesc);
    plansZone.appendChild(cardMonthly);

    // ── Annual card (108:3192) ────────────────────────────────────────────────
    const cardAnnual = document.createElement('div');
    cardAnnual.style.cssText = [
        'display:flex;flex-direction:column;gap:12px;',
        'background:#181818;border-radius:20px;padding:12px;',
        'border:1px solid #202020;cursor:pointer;',
        'box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;',
    ].join('');

    const annualTop = document.createElement('div');
    annualTop.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding-bottom:12px;border-bottom:1px solid #323232;';

    const annualRow = document.createElement('div');
    annualRow.style.cssText = 'display:flex;flex-direction:row;justify-content:space-between;align-items:center;';
    annualRow.innerHTML = `
        <span style="font-family:'Baloo 2',sans-serif;font-weight:600;font-size:24px;line-height:32px;color:#FFFFFF;">Annual plan</span>
        <div style="display:flex;flex-direction:row;align-items:center;gap:12px;">
            <span style="
                font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;
                color:#FFFFFF;background:#3F9C35;border-radius:24px;
                padding:4px 10px;white-space:nowrap;width:106px;
                display:flex;align-items:center;justify-content:center;box-sizing:border-box;
            ">Save $22.89</span>
            <div id="radio-annual" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#323232" stroke-width="2"/></svg>
            </div>
        </div>`;
    annualTop.appendChild(annualRow);

    const annualPrice = document.createElement('div');
    annualPrice.style.cssText = 'display:flex;flex-direction:row;align-items:baseline;gap:4px;flex-wrap:wrap;';
    annualPrice.innerHTML = `
        <span style="font-family:'Baloo 2',sans-serif;font-weight:500;font-size:18px;line-height:28px;color:#ABABAB;text-decoration:line-through;">$107.88</span>
        <span style="font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;color:#ABABAB;"> / </span>
        <span style="font-family:'Baloo 2',sans-serif;font-weight:500;font-size:24px;line-height:32px;color:#FEC348;">$83.99</span>
        <span style="font-family:'Baloo 2',sans-serif;font-weight:500;font-size:18px;line-height:28px;color:#808080;">yearly</span>`;
    annualTop.appendChild(annualPrice);
    cardAnnual.appendChild(annualTop);

    const annualDesc = document.createElement('p');
    annualDesc.style.cssText = "font-family:'Baloo 2',sans-serif;font-weight:400;font-size:16px;line-height:20px;color:#7B7B7B;margin:0;padding:0;";
    annualDesc.textContent = 'Billed Annualy. Cancel anytime';
    cardAnnual.appendChild(annualDesc);
    plansZone.appendChild(cardAnnual);

    // ── CTA zone (flex:0, anchored at bottom) ─────────────────────────────────
    const ctaZone = document.createElement('div');
    ctaZone.style.cssText = [
        'flex-shrink:0;',
        'display:flex;flex-direction:column;align-items:stretch;',
        'gap:10px;',
        'margin-top:auto;',
        'padding-top:16px;',
    ].join('');
    inner.appendChild(ctaZone);

    // CTA button (108:3210)
    const btnTrial = document.createElement('button');
    btnTrial.style.cssText = [
        'width:100%;display:flex;align-items:center;justify-content:center;',
        'background:#FEC348;border:1px solid #0D0D0D;border-radius:32px;',
        'padding:16px 24px;cursor:pointer;',
        'box-sizing:border-box;',
        '-webkit-tap-highlight-color:transparent;',
    ].join('');
    btnTrial.innerHTML = `<span style="font-family:'Baloo 2',sans-serif;font-weight:600;font-size:18px;line-height:28px;color:#0D0D0D;">Continue with Monthly Plan</span>`;
    const btnTrialLabel = btnTrial.querySelector('span');

    btnTrial.addEventListener('click', async () => {
        if (subscriptionIsActive) {
            navigate('#home');
            return;
        }

        const user = auth.getUser();
        const uid = auth.getUserId();
        if (!user?.email || uid === null || uid === undefined) {
            showStatus('Please sign in again before starting a subscription.', 'error');
            return;
        }

        const plan = SUBSCRIPTION_PLANS[selectedPlan];
        btnTrial.disabled = true;
        btnTrial.style.opacity = '0.65';
        btnTrialLabel.textContent = 'Processing...';
        showStatus('Creating your subscription...', 'neutral');

        const transactionId = `APP-${String(uid)}-${Date.now()}`;
        const paymentResult = await subscriptionApi.createPayment({
            uid,
            userEmail: user.email,
            productId: plan.productId,
            amount: plan.amount,
            currency: plan.currency,
            status: 'completed',
            transactionId,
            subscriptionEndDate: getSubscriptionEndDate(selectedPlan),
            location: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        });

        if (!paymentResult.ok) {
            showStatus(paymentResult.error, 'error');
            btnTrial.disabled = false;
            btnTrial.style.opacity = '1';
            btnTrialLabel.textContent = `Continue with ${plan.label} Plan`;
            return;
        }

        const verification = await subscriptionApi.check(uid);
        if (verification.ok && verification.data?.status === 'active') {
            subscriptionIsActive = true;
            const endDate = new Date(verification.data.subscriptionEndDate);
            const formattedEndDate = Number.isNaN(endDate.getTime())
                ? 'your renewal date'
                : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(endDate);
            showStatus(`Subscription active until ${formattedEndDate}.`, 'success');
            try { localStorage.setItem('kidsbible_subscription', JSON.stringify(verification.data)); } catch {}
            btnTrial.disabled = false;
            btnTrial.style.opacity = '1';
            btnTrialLabel.textContent = 'Continue to App';
            return;
        }

        showStatus(verification.error || 'Payment was created, but activation is still pending.', 'error');
        btnTrial.disabled = false;
        btnTrial.style.opacity = '1';
        btnTrialLabel.textContent = `Continue with ${plan.label} Plan`;
    });
    ctaZone.appendChild(btnTrial);

    // Bonus text (108:3213)
    const bonusText = document.createElement('p');
    bonusText.style.cssText = "font-family:'Baloo 2',sans-serif;font-weight:500;font-size:16px;line-height:24px;text-align:center;margin:0;padding:0;";
    bonusText.innerHTML = `<span style="font-weight:400;color:#808080;">Tablet Owner Bonus</span><span style="color:#3F9C35;"> Get 1 Month FREE ACCES</span>`;
    ctaZone.appendChild(bonusText);

    // ── Radio toggle logic ────────────────────────────────────────────────────
    const RADIO_ON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#FEC348" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="#FEC348"/></svg>`;
    const RADIO_OFF = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#323232" stroke-width="2"/></svg>`;

    cardMonthly.addEventListener('click', () => {
        selectedPlan = 'monthly';
        cardMonthly.style.border = '0.5px solid #FEC348';
        cardAnnual.style.border = '1px solid #202020';
        inner.querySelector('#radio-monthly').innerHTML = RADIO_ON;
        inner.querySelector('#radio-annual').innerHTML = RADIO_OFF;
        if (!subscriptionIsActive) btnTrialLabel.textContent = 'Continue with Monthly Plan';
    });

    cardAnnual.addEventListener('click', () => {
        selectedPlan = 'annual';
        cardAnnual.style.border = '0.5px solid #FEC348';
        cardMonthly.style.border = '1px solid #202020';
        inner.querySelector('#radio-annual').innerHTML = RADIO_ON;
        inner.querySelector('#radio-monthly').innerHTML = RADIO_OFF;
        if (!subscriptionIsActive) btnTrialLabel.textContent = 'Continue with Annual Plan';
    });

    const uid = auth.getUserId();
    if (uid !== null && uid !== undefined) {
        subscriptionApi.check(uid).then(result => {
            if (!result.ok || result.data?.status !== 'active') return;
            subscriptionIsActive = true;
            const endDate = new Date(result.data.subscriptionEndDate);
            const formattedEndDate = Number.isNaN(endDate.getTime())
                ? 'your renewal date'
                : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(endDate);
            showStatus(`Your subscription is active until ${formattedEndDate}.`, 'success');
            btnTrialLabel.textContent = 'Continue to App';
            try { localStorage.setItem('kidsbible_subscription', JSON.stringify(result.data)); } catch {}
        });
    }

    return el;
}

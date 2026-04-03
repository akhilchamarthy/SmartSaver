// content_script_checkout.js - Detects checkout pages and recommends best cards

var STORAGE_KEY = 'smartsaver_cards';
let userCards = [];
let isCheckoutPage = false;
let recommendationShown = false;

console.log('[perq] Checkout detector loaded on', window.location.href);

// Website category mapping
const WEBSITE_CATEGORIES = {
  // Shopping
  'amazon.com': 'shopping',
  'nike.com': 'shopping',
  'adidas.com': 'shopping',
  'target.com': 'shopping',
  'walmart.com': 'shopping',
  'bestbuy.com': 'shopping',
  'macys.com': 'shopping',
  'nordstrom.com': 'shopping',
  'etsy.com': 'shopping',
  'ebay.com': 'shopping',
  
  // Groceries
  'instacart.com': 'groceries',
  'kroger.com': 'groceries',
  'safeway.com': 'groceries',
  'wholefoods.com': 'groceries',
  'costco.com': 'groceries',
  
  // Dining
  'doordash.com': 'dining',
  'ubereats.com': 'dining',
  'grubhub.com': 'dining',
  'postmates.com': 'dining',
  'seamless.com': 'dining',
  'opentable.com': 'dining',
  
  // Gas
  'shell.com': 'gas',
  'exxon.com': 'gas',
  'bp.com': 'gas',
  'chevron.com': 'gas',
  
  // Travel
  'expedia.com': 'travel',
  'booking.com': 'travel',
  'airbnb.com': 'travel',
  'hotels.com': 'travel',
  'kayak.com': 'travel',
  'priceline.com': 'travel',
  'delta.com': 'travel',
  'united.com': 'travel',
  'american.com': 'travel',
  'southwest.com': 'travel'
};

function getCurrentDomain() {
  return window.location.hostname.replace('www.', '');
}

function getWebsiteCategory() {
  const domain = getCurrentDomain();
  return WEBSITE_CATEGORIES[domain] || 'other';
}

function detectCheckoutPage() {
  // 1. URL path must contain a checkout-specific segment (not just any substring)
  const urlPath = window.location.pathname.toLowerCase();
  const urlCheckoutPattern = /\/(checkout|payment|billing|pay|order-confirm|order-review|place-order)(\/|$)/;
  const urlMatches = urlCheckoutPattern.test(urlPath);

  // 2. Look for actual credit card number input fields (specific to payment forms)
  const cardInputSelectors = [
    'input[name="cardnumber"]',
    'input[name="card_number"]',
    'input[name="cc-number"]',
    'input[id*="card-number"]',
    'input[id*="cardnumber"]',
    'input[id*="cc-number"]',
    'input[autocomplete="cc-number"]',
    'input[data-stripe="number"]',
    'input[maxlength="16"][type="tel"]',
    'input[maxlength="19"][type="tel"]',
    'input[maxlength="16"][type="text"][name*="card"]',
    // Stripe / Braintree iframes embed payment fields
    'iframe[name*="stripe"]',
    'iframe[id*="stripe"]',
    'iframe[src*="stripe"]',
    'iframe[src*="braintree"]',
    'iframe[src*="paypal"]',
    '[data-braintree-id]',
  ];

  const hasCardInput = cardInputSelectors.some(sel => document.querySelector(sel));

  // 3. Require at least two specific co-occurring payment keywords (reduces false positives)
  const pageText = document.body.innerText.toLowerCase();
  const specificKeywords = ['card number', 'cvv', 'cvc', 'expir', 'security code', 'billing address'];
  const keywordMatches = specificKeywords.filter(kw => pageText.includes(kw)).length;
  const hasPaymentForm = keywordMatches >= 2;

  if (urlMatches) {
    console.log('[perq] Checkout detected via URL path', urlPath);
    return true;
  }
  if (hasCardInput) {
    console.log('[perq] Checkout detected via card input fields');
    return true;
  }
  if (hasPaymentForm) {
    console.log('[perq] Checkout detected via payment form keywords', keywordMatches);
    return true;
  }

  console.log('[perq] Checkout NOT detected on', window.location.href);
  return false;
}

function getBestCardForCategory(category) {
  if (!userCards.length) return null;

  let bestCard = null;
  let highestRate = 0;

  userCards.forEach(card => {
    if (card.cashback && card.cashback[category]) {
      const rate = parseFloat(card.cashback[category]);
      if (rate > highestRate) {
        highestRate = rate;
        bestCard = card;
      }
    }
  });

  // If no specific category match, find best general rate
  if (!bestCard) {
    userCards.forEach(card => {
      if (card.cashback && card.cashback.other) {
        const rate = parseFloat(card.cashback.other);
        if (rate > highestRate) {
          highestRate = rate;
          bestCard = card;
        }
      }
    });
  }

  return bestCard;
}

function createRecommendationPopup(recommendedCard, category) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('perq-recommendation');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'perq-recommendation';
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    background: #0D0C20;
    border: 1px solid rgba(124, 58, 237, 0.35);
    color: #E0E7FF;
    padding: 16px;
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
    z-index: 10000;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    animation: slideIn 0.3s ease-out;
  `;

  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const cashbackRate = recommendedCard.cashback[category] || recommendedCard.cashback.other || 1;

  popup.innerHTML = `
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 24px; height: 24px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          💳
        </div>
        <div style="font-weight: 600; font-size: 16px;">perq</div>
      </div>
      <button id="close-recommendation" style="background: none; border: none; color: #6B6B8E; font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
    
    <div style="margin-bottom: 8px;">
      <div style="font-weight: 600; margin-bottom: 4px; color: #A78BFA;">Best card for ${categoryName}</div>
      <div style="background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.25); padding: 8px; border-radius: 6px;">
        <div style="font-weight: 600; font-size: 14px; color: #E0E7FF;">${recommendedCard.name}</div>
        <div style="font-size: 11px; color: #22D3EE; margin-top: 2px;">${recommendedCard.bank} · ${cashbackRate}% cashback</div>
      </div>
    </div>
    
    <div style="font-size: 11px; color: #6B6B8E; margin-bottom: 12px;">
      You're shopping on ${getCurrentDomain()} - this card gives you the highest cashback rate for ${categoryName.toLowerCase()} purchases.
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button id="open-wallet" style="flex: 1; background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
        View Wallet
      </button>
      <button id="dismiss-recommendation" style="flex: 1; background: rgba(255,255,255,0.06); color: #6B6B8E; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
        Dismiss
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  // Add event listeners
  document.getElementById('close-recommendation').addEventListener('click', () => {
    popup.remove();
  });

  document.getElementById('dismiss-recommendation').addEventListener('click', () => {
    popup.remove();
  });

  document.getElementById('open-wallet').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
    popup.remove();
  });

  // Auto-dismiss after 10 seconds
  // setTimeout(() => {
  //   if (document.getElementById('perq-recommendation')) {
  //     popup.remove();
  //   }
  // }, 10000);
}

function loadUserCards() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    userCards = result[STORAGE_KEY] || [];
    console.log('[perq] Loaded user cards:', userCards.length, userCards);
    checkAndShowRecommendation();
  });
}

function checkAndShowRecommendation() {
  if (recommendationShown) {
    return;
  }

  if (!userCards.length) {
    console.log('[perq] No user cards found in storage; skipping recommendation');
    return;
  }

  const isCheckout = detectCheckoutPage();
  if (!isCheckout) {
    return;
  }

  const category = getWebsiteCategory();
  console.log('[perq] Website category resolved to', category, 'for domain', getCurrentDomain());
  const bestCard = getBestCardForCategory(category);

  if (bestCard) {
    console.log('[perq] Best card found for category', category, bestCard);
    recommendationShown = true;
    createRecommendationPopup(bestCard, category);
  } else {
    console.log('[perq] No suitable card found for category', category);
  }
}

// Initialize
function init() {
  loadUserCards();
  
  // Listen for URL changes in SPAs (history navigation)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      recommendationShown = false; // Reset for new page
      setTimeout(checkAndShowRecommendation, 800);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: false // Only top-level changes, not deep subtree
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
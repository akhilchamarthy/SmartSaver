// content_script_checkout.js - Detects checkout pages and recommends best cards

var STORAGE_KEY = 'smartsaver_cards';
let userCards = [];
let isCheckoutPage = false;
let recommendationShown = false;

console.log('[SmartSaver] Checkout detector loaded on', window.location.href);

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
  // Look for payment-related elements
  const paymentSelectors = [
    'input[name*="card"]',
    'input[id*="card"]',
    'input[name*="credit"]',
    'input[id*="credit"]',
    'input[name*="payment"]',
    'input[id*="payment"]',
    'input[placeholder*="card"]',
    'input[placeholder*="credit"]',
    '.payment',
    '.checkout',
    '.billing',
    '#payment',
    '#checkout',
    '#billing'
  ];

  const checkoutKeywords = [
    'checkout', 'payment', 'billing', 'card number', 'credit card',
    'pay now', 'complete order', 'place order', 'review order'
  ];

  // Check for payment input fields
  for (const selector of paymentSelectors) {
    if (document.querySelector(selector)) {
      console.log('[SmartSaver] Checkout detected via selector', selector);
      return true;
    }
  }

  // Check for checkout keywords in page text
  const pageText = document.body.innerText.toLowerCase();
  for (const keyword of checkoutKeywords) {
    if (pageText.includes(keyword)) {
      console.log('[SmartSaver] Checkout detected via keyword', keyword);
      return true;
    }
  }

  // Check URL for checkout indicators
  const url = window.location.href.toLowerCase();
  const urlKeywords = ['checkout', 'payment', 'billing', 'cart', 'order'];
  for (const keyword of urlKeywords) {
    if (url.includes(keyword)) {
      console.log('[SmartSaver] Checkout detected via URL keyword', keyword);
      return true;
    }
  }

  console.log('[SmartSaver] Checkout NOT detected on', window.location.href);
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
  const existingPopup = document.getElementById('smartsaver-recommendation');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'smartsaver-recommendation';
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
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
        <div style="font-weight: 600; font-size: 16px;">SmartSaver</div>
      </div>
      <button id="close-recommendation" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
    
    <div style="margin-bottom: 8px;">
      <div style="font-weight: 600; margin-bottom: 4px;">💡 Your Best Card for ${categoryName}</div>
      <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 6px;">
        <div style="font-weight: 600; font-size: 15px;">${recommendedCard.name}</div>
        <div style="font-size: 12px; opacity: 0.9;">${recommendedCard.bank} * ${cashbackRate}% cashback</div>
      </div>
    </div>
    
    <div style="font-size: 12px; opacity: 0.8; margin-bottom: 12px;">
      You're shopping on ${getCurrentDomain()} - this card gives you the highest cashback rate for ${categoryName.toLowerCase()} purchases.
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button id="open-wallet" style="flex: 1; background: white; color: #2563eb; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
        View Wallet
      </button>
      <button id="dismiss-recommendation" style="flex: 1; background: rgba(255, 255, 255, 0.2); color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
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
  //   if (document.getElementById('smartsaver-recommendation')) {
  //     popup.remove();
  //   }
  // }, 10000);
}

function loadUserCards() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    userCards = result[STORAGE_KEY] || [];
    console.log('[SmartSaver] Loaded user cards:', userCards.length, userCards);
    checkAndShowRecommendation();
  });
}

function checkAndShowRecommendation() {
  if (recommendationShown) {
    return;
  }

  if (!userCards.length) {
    console.log('[SmartSaver] No user cards found in storage; skipping recommendation');
    return;
  }

  const isCheckout = detectCheckoutPage();
  if (!isCheckout) {
    return;
  }

  const category = getWebsiteCategory();
  console.log('[SmartSaver] Website category resolved to', category, 'for domain', getCurrentDomain());
  const bestCard = getBestCardForCategory(category);

  if (bestCard) {
    console.log('[SmartSaver] Best card found for category', category, bestCard);
    recommendationShown = true;
    createRecommendationPopup(bestCard, category);
  } else {
    console.log('[SmartSaver] No suitable card found for category', category);
  }
}

// Initialize
function init() {
  loadUserCards();
  
  // Check periodically for checkout page changes
  setInterval(() => {
    if (!recommendationShown) {
      checkAndShowRecommendation();
    }
  }, 2000);

  // Listen for DOM changes (for SPAs)
  const observer = new MutationObserver(() => {
    if (!recommendationShown) {
      setTimeout(checkAndShowRecommendation, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// card_details.js

const STORAGE_KEY = 'smartsaver_cards';
let cards = [];
let currentCard = null;

function getCardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cardId');
}

function loadCardsForDetails(callback) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    cards = result[STORAGE_KEY] || [];
    if (callback) callback();
  });
}

function saveCardsFromDetails() {
  chrome.storage.local.set({ [STORAGE_KEY]: cards });
}

function findCurrentCard(cardId) {
  currentCard = cards.find(c => c.id === cardId) || null;
  if (currentCard && !Array.isArray(currentCard.benefits)) {
    currentCard.benefits = [];
  }
}

function renderCardHeader() {
  if (!currentCard) return;
  const titleEl = document.getElementById('card-title');
  const subtitleEl = document.getElementById('card-subtitle');

  titleEl.textContent = currentCard.name || 'Untitled card';

  const parts = [];
  if (currentCard.bank) parts.push(currentCard.bank);
  if (currentCard.last4) parts.push(`${currentCard.last4}`);
  if (currentCard.type) parts.push(currentCard.type.toUpperCase());

  // subtitleEl.textContent = parts.join(' • ');
}

function renderBenefits() {
  const list = document.getElementById('benefits-list');
  if (!list || !currentCard) return;

  list.innerHTML = '';

  if (!currentCard.benefits || !currentCard.benefits.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No benefits yet. Add one below (e.g. $100 Resy credit each quarter).';
    empty.style.fontSize = '11px';
    empty.style.color = '#6b7280';
    list.appendChild(empty);
    return;
  }

  currentCard.benefits.forEach((benefit, index) => {
    const item = document.createElement('div');
    item.className = 'benefit-item';

    const nameRow = document.createElement('div');
    nameRow.className = 'benefit-name-row';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = benefit.name || 'Untitled benefit';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'button-small button-danger';
    deleteBtn.textContent = 'Remove';
    deleteBtn.addEventListener('click', () => {
      currentCard.benefits.splice(index, 1);
      saveCardsFromDetails();
      renderBenefits();
    });
    nameRow.appendChild(nameSpan);
    nameRow.appendChild(deleteBtn);

    const meta = document.createElement('div');
    meta.className = 'benefit-meta';
    const periodLabel = benefit.period === 'quarter' ? 'Quarterly'
                      : benefit.period === 'semiannual' ? 'Every 6 months'
                      : benefit.period === 'monthly' ? 'Monthly'
                      : benefit.period === 'annual' ? 'Annual'
                      : 'Other';
    meta.textContent = `${periodLabel} $${benefit.limit || 0} per period`;

    const progress = document.createElement('div');
    progress.className = 'benefit-progress';
    const used = Number(benefit.used || 0);
    const limit = Number(benefit.limit || 0);
    const remaining = limit - used;
    progress.textContent = `Used $${used} of $${limit}${limit ? ` Remaining $${Math.max(0, remaining)}` : ''}`;

    const actions = document.createElement('div');
    actions.className = 'benefit-actions';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.value = used;
    input.addEventListener('change', () => {
      const newVal = Number(input.value || 0);
      benefit.used = newVal;
      saveCardsFromDetails();
      renderBenefits();
    });

    const label = document.createElement('span');
    label.style.fontSize = '11px';
    label.textContent = 'Used this period ($)';

    actions.appendChild(label);
    actions.appendChild(input);

    item.appendChild(nameRow);
    item.appendChild(meta);
    item.appendChild(progress);
    item.appendChild(actions);

    list.appendChild(item);
  });
}

function handleAddBenefit() {
  if (!currentCard) return;

  const nameInput = document.getElementById('benefit-name-input');
  const periodInput = document.getElementById('benefit-period-input');
  const limitInput = document.getElementById('benefit-limit-input');
  const usedInput = document.getElementById('benefit-used-input');

  const name = (nameInput.value || '').trim();
  const period = periodInput.value;
  const limit = Number(limitInput.value || 0);
  const used = Number(usedInput.value || 0);

  if (!name) {
    nameInput.focus();
    return;
  }

  if (!Array.isArray(currentCard.benefits)) {
    currentCard.benefits = [];
  }

  currentCard.benefits.push({
    id: Date.now().toString(),
    name,
    period,
    limit,
    used
  });

  saveCardsFromDetails();
  renderBenefits();

  nameInput.value = '';
  limitInput.value = '';
  usedInput.value = '';
  periodInput.value = 'quarter';
}

function handleBack() {
  window.location.href = chrome.runtime.getURL('popup.html');
}

// Init

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('back-to-main');
  const addBenefitBtn = document.getElementById('add-benefit-button');

  if (backBtn) backBtn.addEventListener('click', handleBack);
  if (addBenefitBtn) addBenefitBtn.addEventListener('click', handleAddBenefit);

  const cardId = getCardIdFromUrl();
  if (!cardId) return;

  loadCardsForDetails(() => {
    findCurrentCard(cardId);
    if (!currentCard) return;
    renderCardHeader();
    renderBenefits();
  });
});

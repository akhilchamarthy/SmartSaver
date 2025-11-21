// wallet.js

const STORAGE_KEY = 'smartsaver_cards';

let cards = [];
let currentCardId = null;
let defaultBenefits = {};

const BANK_CARDS = {
  amex: [
    'Blue Cash Preferred',
    'Blue Cash Everyday',
    'Gold Card',
    'Platinum Card',
    'Everyday Card'
  ],
  chase: [
    'Chase Freedom Flex',
    'Chase Freedom Unlimited',
    'Sapphire Preferred',
    'Sapphire Reserve',
    'Chase Ink Business Cash'
  ],
  citi: [
    'Citi Custom Cash',
    'Citi Double Cash',
    'Citi Premier'
  ],
  boa: [
    'Bank of America Customized Cash',
    'Bank of America Travel Rewards'
  ],
  discover: [
    'Discover it Cash Back',
    'Discover it Miles'
  ],
  other: [
    'Generic Credit Card',
    'Generic Debit Card'
  ]
};

function getBankLabel(bankCode) {
  switch (bankCode) {
    case 'amex': return 'American Express';
    case 'chase': return 'Chase';
    case 'citi': return 'Citi';
    case 'boa': return 'Bank of America';
    case 'discover': return 'Discover';
    case 'other': return 'Other';
    default: return bankCode || 'Unknown bank';
  }
}

function loadCards() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    cards = result[STORAGE_KEY] || [];
    renderCardStack();
  });
}

function saveCards() {
  chrome.storage.local.set({ [STORAGE_KEY]: cards });
}

// ---- Rendering ----

function renderCardStack() {
  const stack = document.getElementById('card-stack');
  if (!stack) return;

  stack.innerHTML = '';

  if (!cards.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No cards yet. Add one above.';
    empty.style.fontSize = '11px';
    empty.style.color = '#6b7280';
    stack.appendChild(empty);
    setPreview(null);
    return;
  }

  cards.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'card-item';
    el.textContent = card.name || 'Untitled card';

    el.addEventListener('mouseenter', () => setPreview(card));
    el.addEventListener('mouseleave', () => setPreview(null));
    el.addEventListener('click', () => openDetails(card.id));

    stack.appendChild(el);
  });
}

function setPreview(card) {
  const preview = document.getElementById('card-preview');
  if (!preview) return;

  preview.classList.remove('card-preview-empty');
  preview.innerHTML = '';

  if (!card) {
    preview.classList.add('card-preview-empty');
    const placeholder = document.createElement('div');
    placeholder.className = 'card-preview-placeholder';
    placeholder.textContent = 'Hover over a card to preview it';
    preview.appendChild(placeholder);
    return;
  }

  const topRow = document.createElement('div');
  topRow.className = 'card-row';
  const bank = document.createElement('div');
  bank.className = 'card-bank';
  bank.textContent = card.bank || 'Unknown bank';
  const type = document.createElement('div');
  type.textContent = (card.type || 'credit').toUpperCase();
  topRow.appendChild(bank);
  topRow.appendChild(type);

  const name = document.createElement('div');
  name.className = 'card-main-name';
  name.textContent = card.name || 'Untitled card';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'card-row';
  const last4 = document.createElement('div');
  last4.className = 'card-last4';
  last4.textContent = card.last4 ? `${card.last4}` : '';
  const network = document.createElement('div');
  network.textContent = card.bank?.toLowerCase().includes('amex') ? 'AMEX'
                    : card.bank?.toLowerCase().includes('chase') ? 'VISA'
                    : '';
  bottomRow.appendChild(last4);
  bottomRow.appendChild(network);

  preview.appendChild(topRow);
  preview.appendChild(name);
  preview.appendChild(bottomRow);
}

// ---- Details view ----

function openDetails(cardId) {
  currentCardId = cardId;
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  const mainView = document.getElementById('wallet-main-view');
  const detailsView = document.getElementById('wallet-details-view');

  if (!mainView || !detailsView) return;

  mainView.style.display = 'none';
  detailsView.classList.remove('hidden');

  renderCardHeader(card);
  renderBenefits(card);
}

function closeDetails() {
  currentCardId = null;
  const mainView = document.getElementById('wallet-main-view');
  const detailsView = document.getElementById('wallet-details-view');
  if (!mainView || !detailsView) return;

  detailsView.classList.add('hidden');
  mainView.style.display = 'block';
}

function renderCardHeader(card) {
  const titleEl = document.getElementById('card-title');
  const subtitleEl = document.getElementById('card-subtitle');
  
  if (titleEl) titleEl.textContent = card.name || 'Untitled card';
  
  if (subtitleEl) {
    const parts = [];
    if (card.bank) parts.push(card.bank);
    if (card.last4) parts.push(`${card.last4}`);
    if (card.type) parts.push(card.type.toUpperCase());
    // subtitleEl.textContent = parts.join(' • ');
  }
}

function renderBenefits(card) {
  const list = document.getElementById('benefits-list');
  if (!list) return;

  list.innerHTML = '';

  if (!card.benefits || !card.benefits.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No benefits yet. Add one below or they were auto-loaded when you added this card.';
    empty.style.fontSize = '10px';
    empty.style.color = '#6b7280';
    list.appendChild(empty);
    return;
  }

  card.benefits.forEach((benefit, index) => {
    const item = document.createElement('div');
    item.className = 'benefit-item';

    const nameRow = document.createElement('div');
    nameRow.className = 'benefit-name-row';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = benefit.name || 'Untitled benefit';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'button-small button-danger';
    deleteBtn.textContent = 'Remove';
    deleteBtn.style.fontSize = '9px';
    deleteBtn.style.padding = '2px 6px';
    deleteBtn.addEventListener('click', () => {
      card.benefits.splice(index, 1);
      saveCards();
      renderBenefits(card);
    });
    nameRow.appendChild(nameSpan);
    nameRow.appendChild(deleteBtn);

    const meta = document.createElement('div');
    meta.className = 'benefit-meta';
    const periodLabel = benefit.period === 'quarter' ? 'Quarterly'
                      : benefit.period === 'semiannual' ? 'Every 6 months'
                      : benefit.period === 'annual' ? 'Annual'
                      : benefit.period === 'monthly' ? 'Monthly'
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
      saveCards();
      renderBenefits(card);
    });

    const label = document.createElement('span');
    label.style.fontSize = '10px';
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

function loadDefaultBenefits() {
  fetch(chrome.runtime.getURL('default_benefits.json'))
    .then(response => response.json())
    .then(data => {
      defaultBenefits = data;
    })
    .catch(error => {
      console.log('Could not load default benefits:', error);
      defaultBenefits = {};
    });
}

function getDefaultBenefitsForCard(bankCode, cardName) {
  if (!defaultBenefits[bankCode] || !defaultBenefits[bankCode][cardName]) {
    return [];
  }
  return defaultBenefits[bankCode][cardName].map(benefit => ({
    id: Date.now().toString() + Math.random(),
    ...benefit
  }));
}

function updateCardNameOptions() {
  const bankSelect = document.getElementById('card-bank-select');
  const nameSelect = document.getElementById('card-name-select');
  if (!bankSelect || !nameSelect) return;

  const bankCode = bankSelect.value;
  nameSelect.innerHTML = '';

  if (!bankCode) {
    nameSelect.disabled = true;
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Select a bank first';
    nameSelect.appendChild(opt);
    return;
  }

  const cardNames = BANK_CARDS[bankCode] || [];
  nameSelect.disabled = false;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select card';
  placeholder.disabled = true;
  placeholder.selected = true;
  nameSelect.appendChild(placeholder);

  cardNames.forEach((cardName) => {
    const opt = document.createElement('option');
    opt.value = cardName;
    opt.textContent = cardName;
    nameSelect.appendChild(opt);
  });
}

// ---- Events ----

function handleAddCard() {
  const bankSelect = document.getElementById('card-bank-select');
  const nameSelect = document.getElementById('card-name-select');
  const last4Input = document.getElementById('card-last4-input');
  const typeInput = document.getElementById('card-type-input');

  if (!bankSelect || !nameSelect || !last4Input || !typeInput) return;

  const bankCode = bankSelect.value;
  const cardName = nameSelect.value;
  const last4 = last4Input.value.trim();
  const type = typeInput.value;

  if (!bankCode) {
    bankSelect.focus();
    return;
  }

  if (!cardName) {
    nameSelect.focus();
    return;
  }

  const bankLabel = getBankLabel(bankCode);

  const newCard = {
    id: Date.now().toString(),
    name: cardName,
    bank: bankLabel,
    last4,
    type,
    notes: '',
    benefits: getDefaultBenefitsForCard(bankCode, cardName)
  };

  cards.push(newCard);
  saveCards();
  renderCardStack();

  // reset form
  bankSelect.value = '';
  updateCardNameOptions();
  last4Input.value = '';
  typeInput.value = 'credit';
}

function handleSaveDetails() {
  if (!currentCardId) return;
  const card = cards.find(c => c.id === currentCardId);
  if (!card) return;

  const notesEl = document.getElementById('details-notes');
  card.notes = notesEl.value || '';
  saveCards();
}

function handleDeleteCard() {
  if (!currentCardId) return;
  cards = cards.filter(c => c.id !== currentCardId);
  saveCards();
  closeDetails();
  renderCardStack();
}

function handleAddBenefit() {
  if (!currentCardId) return;
  const card = cards.find(c => c.id === currentCardId);
  if (!card) return;

  const nameInput = document.getElementById('benefit-name-input');
  const periodInput = document.getElementById('benefit-period-input');
  const limitInput = document.getElementById('benefit-limit-input');
  const usedInput = document.getElementById('benefit-used-input');

  if (!nameInput || !periodInput || !limitInput || !usedInput) return;

  const name = (nameInput.value || '').trim();
  const period = periodInput.value;
  const limit = Number(limitInput.value || 0);
  const used = Number(usedInput.value || 0);

  if (!name) {
    nameInput.focus();
    return;
  }

  if (!Array.isArray(card.benefits)) {
    card.benefits = [];
  }

  card.benefits.push({
    id: Date.now().toString(),
    name,
    period,
    limit,
    used
  });

  saveCards();
  renderBenefits(card);

  nameInput.value = '';
  limitInput.value = '';
  usedInput.value = '';
  periodInput.value = 'quarter';
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(tabName + '-tab').classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName + '-content').classList.add('active');
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-card-button');
  const backBtn = document.getElementById('back-to-wallet');
  const addBenefitBtn = document.getElementById('add-benefit-button');
  const bankSelect = document.getElementById('card-bank-select');
  const offersTab = document.getElementById('offers-tab');
  const walletTab = document.getElementById('wallet-tab');

  if (addBtn) addBtn.addEventListener('click', handleAddCard);
  if (backBtn) backBtn.addEventListener('click', closeDetails);
  if (addBenefitBtn) addBenefitBtn.addEventListener('click', handleAddBenefit);
  if (bankSelect) bankSelect.addEventListener('change', updateCardNameOptions);
  if (offersTab) offersTab.addEventListener('click', () => switchTab('offers'));
  if (walletTab) walletTab.addEventListener('click', () => switchTab('wallet'));

  // Initialize card-name select state
  updateCardNameOptions();
  loadDefaultBenefits();
  loadCards();
});
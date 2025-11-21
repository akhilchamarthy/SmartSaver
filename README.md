# SmartSaver

- Confirm wallet scope (local ledger vs. bank integration, features, currencies).
- Design data model (accounts, transactions, categories) and storage strategy using chrome.storage.sync.
- Update manifest.json to include "storage" permission.
- Add Wallet tab to popup.html with simple UI (balance, add transaction form, recent list).
- Implement wallet.js to handle UI events and persistence (CRUD, totals).
- Wire wallet.js into popup (import script), keep existing AMEX/Chase features intact.
- Polish UX (validation, currency formatting) and basic styles in popup.css.

Optional: CSV export and simple budgets/limits per category.

// background.js - Service worker for SmartSaver extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // Open the extension popup programmatically
    chrome.action.openPopup();
  }
});

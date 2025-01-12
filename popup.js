

function injectTheAmexScript() {
  // Query the active tab, which will be only one tab and inject the script in it.
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.scripting.executeScript({target: {tabId: tabs[0].id}, files: ['content_script_amex.js']})
  })
}

function injectTheChaseScript() {
  // Query the active tab, which will be only one tab and inject the script in it.
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.scripting.executeScript({target: {tabId: tabs[0].id}, files: ['content_script_chase.js']})
  })
}

document.getElementById('amex-button').addEventListener('click', injectTheAmexScript)
document.getElementById('chase-button').addEventListener('click', injectTheChaseScript)
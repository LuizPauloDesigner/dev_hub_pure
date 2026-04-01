// Background service worker for Chrome Extension
// Opens a new tab when extension icon is clicked

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DevCenter extension installed');
});

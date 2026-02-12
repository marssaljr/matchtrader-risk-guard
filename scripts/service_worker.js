const DEFAULT_MONEY_LIMIT = 100;

function getStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["moneyLimit"], resolve);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "GET_STATE") {
    getStorage().then((result) => {
      sendResponse({
        moneyLimit: result.moneyLimit ?? DEFAULT_MONEY_LIMIT
      });
    });
    return true;
  }

  if (message.type === "SET_LIMIT") {
    chrome.storage.local.set(
      { moneyLimit: message.moneyLimit },
      () => sendResponse({ success: true })
    );
    return true;
  }
});

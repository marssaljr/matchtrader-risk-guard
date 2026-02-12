let orderList = [];
let lastWasNegative = false;
let isRunning = false;
let previousOrderCount = 0;
let moneyLimit = 0;

function getState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, resolve);
  });
}

function addOrder(amount) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "ADD_ORDER", amount },
      resolve
    );
  });
}


function clearCustomItems() {
  document.querySelectorAll('.my-extension-item').forEach(el => el.remove());
}

function waitForElement(selector, callback) {
  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (!el) return;

    observer.disconnect();
    callback(el);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function waitForTotalValue(callback) {
  const getValidTotal = () => {
    const container = document.querySelector('[data-testid="closed-positions-actions-desktop"]');
    if (!container) return null;

    const valueNode = container.children?.[0]?.children?.[1];
    if (!valueNode) return null;

    const raw = valueNode.textContent || '';
    const total = raw.split('USD')[0].trim();

    if (!total) return null;

    const numeric = Number(total.replace(',', '.'));

    if (numeric === 0) return null;

    return total;
  };

  const immediate = getValidTotal();
  if (immediate) {
    callback(immediate);
    return;
  }

  const observer = new MutationObserver(() => {
    const total = getValidTotal();
    if (!total) return;

    observer.disconnect();
    callback(total);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}



function waitForOrders(callback) {
  const getValidOrders = () => {
   const wrapper = document.querySelector('[data-testid="orders-desktop-list-wrapper"]');
      if (!wrapper) return;

    const listContainer = wrapper.children[0];
    if (!listContainer) return;

    if (listContainer.children.length > 0) {
      return Array.from(listContainer.children)
    }
  }

  const immediate = getValidOrders();
  if (immediate) {
    callback(immediate);
    return;
  }

  const observer = new MutationObserver(() => {
    const orders = getValidOrders();
    if (!orders) return;

    observer.disconnect();
    callback(orders);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function waitForTotalValuePromise(timeout = 8000) {
  return new Promise((resolve) => {

    const getValidTotal = () => {
      const container = document.querySelector('[data-testid="closed-positions-actions-desktop"]');
      if (!container) return null;

      const valueNode = container.children?.[0]?.children?.[1];
      if (!valueNode) return null;

      const raw = valueNode.textContent || '';
      const total = raw.split('USD')[0].trim();
      if (!total) return null;

      const numeric = Number(total.replace(',', '.'));
      if (numeric === 0) return null;

      return total;
    };

    const immediate = getValidTotal();
    if (immediate) {
      resolve(immediate);
      return;
    }

    const observer = new MutationObserver(() => {
      const total = getValidTotal();
      if (!total) return;

      clearTimeout(timer);
      observer.disconnect();
      resolve(total);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function waitForOrdersPromise(timeout = 2000) {
  return new Promise((resolve) => {

    const getValidOrders = () => {
      const wrapper = document.querySelector('[data-testid="orders-desktop-list-wrapper"]');
      if (!wrapper) return null;

      const listContainer = wrapper.children[0];
      if (!listContainer) return null;

      if (listContainer.children.length > 0) {
        return Array.from(listContainer.children);
      }

      return null;
    };

    const immediate = getValidOrders();
    if (immediate) {
      resolve(immediate);
      return;
    }

    const observer = new MutationObserver(() => {
      const orders = getValidOrders();
      if (!orders) return;

      clearTimeout(timer);
      observer.disconnect();
      resolve(orders);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve([]);
    }, timeout);
  });
}


function insertTradeFundItem(container, label, value, suffix = '') {
  const html = `
    <trade-fund-item class="trade-funds-multiselect__profit trade-fund-item my-extension-item">
      <span class="trade-fund-item__name">${label}</span>
      <ui-suffix class="trade-fund-item__value ui-suffix">
        <span class="ui-suffix__value">
          ${value} ${suffix ? `<sup class="ui-suffix__suffix">${suffix}</sup>` : ''}
        </span>
      </ui-suffix>
    </trade-fund-item>
  `;

  container.insertAdjacentHTML('beforeend', html);
}

async function getUITabs() {
   if (isRunning) return;
   isRunning = true;

   const state = await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "GET_STATE" }, resolve);
   });

   if (state.blocked) {
      blockInterface();
      isRunning = false;
      return;
   }

   try {
      const ordersTab = document.querySelector('[tabid="orders"]');
      const closedTab = document.querySelector('[tabid="closed"]');
      const tradeFunds = document.querySelector('[data-testid="trade-funds"]');

      if (!ordersTab || !closedTab || !tradeFunds) {
         return;
   }

   clearCustomItems();

   closedTab.click();

   const total = await waitForTotalValuePromise(8000);
   if (total) {
   insertTradeFundItem(tradeFunds, 'Total', total, 'USD');
   }


   const tradeButtons = document.querySelector('#desktopMarket');
   const overlay = document.querySelector('[data-testid="quick-trade-overlay"]');
   let isNegative = false;

   if (total) {
      const numericTotal = Number(total.replace(',', '.'));
      
      chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
         
         moneyLimit = state.moneyLimit;
         
         if (numericTotal <= -moneyLimit) {
            isNegative = true
            blockInterface();
         }
      });
   }
   // isNegative = (total ? Number(total.replace(',', '.')) : 0) < 0;

   const body = document.body;
   // body.style.background = 'var(--surface-primary);';

   ordersTab.click();

   const items = await waitForOrdersPromise(8000);
   orderList = items.map(item => item.textContent.trim());
   insertTradeFundItem(tradeFunds, 'Trades', items.length);

   if (items.length <= 2 || isNegative) {
      body.style.background = '#530312';
      if (tradeButtons) tradeButtons.remove();
      if (overlay) overlay.remove();
   }
   
   const openTab = document.querySelector('[tabid="open"]');
   if (openTab) openTab.click();

   } catch (err) {
      console.log('Erro no ciclo:', err);
   } finally {
      isRunning = false;
   }
}

function blockInterface() {
   if (document.getElementById('loss-block-overlay')) return;
  const overlay = document.createElement("div");
  overlay.id = "loss-block-overlay";

  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.9)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 999999;
  overlay.style.fontSize = "24px";

  overlay.innerText = "Daily loss limit reached.";

  document.body.appendChild(overlay);
}

function reportLoss() {
   blockInterface();
  chrome.runtime.sendMessage({ type: "ADD_LOSS" }, (state) => {

    if (state.blocked) {
      blockInterface();
    }
  });
}

chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
  if (state.blocked) {
    blockInterface();
  }
});

window.addEventListener('load', () => {
  setTimeout(() => {
    getUITabs();

    setInterval(() => {
      getUITabs();
    }, 60000);

  }, 1000);
});

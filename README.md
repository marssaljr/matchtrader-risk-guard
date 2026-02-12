# 🚫 MatchTrader Risk Guard

Extension for disciplined risk control in MatchTrader.

Automatically blocks the interface when the daily closed loss reaches the configured limit.

No emotion. No second chances.

---

## 🎯 Objective

Prevent overtrading and break impulsive loss cycles.

The extension:

- Reads the **daily closed total** (*Closed* tab)
- Compares it to the user-defined limit
- If it reaches the maximum loss → blocks the interface
- Prevents new interactions until the next day

All local. No backend. No data transmission.

---

## ⚙️ How it Works

1. User sets a daily limit in USD
2. The extension monitors the closed total
3. When the closed value ≤ -limit
4. The interface is automatically blocked

Automatic reset the next day. ---

## 🧠 Philosophy

Discipline > emotion
Rule > impulse
System > will

This extension doesn't attempt to predict the market.

It protects you from yourself.

---

## 🛠 Installation (Developer Mode)

1. Clone the repository:

```bash
git clone https://github.com/your-username/matchtrader-extension.git

```
2. Open Chrome
3. Go to chrome://extensions/
4. Enable Developer Mode
5. Click Load uncompressed
6. Select the project folder

---

## 🔒 Privacy

- No data is sent to external servers
- Everything is stored locally via chrome.storage
- The extension only reads visual elements of the page

---

## 📦 Structure

```pgsql
matchtrader-extension/
├── scripts/

├── content.js

├── popup.js

├── service_worker.js
├── icon.png
├── index.html
├── manifest.json
└── README.md

```

---

## ⚠️ Limitations

- Works only on the desktop version of MatchTrader
- May break if the platform changes the DOM
- The lock is local (user can remove the extension)

---

## 🧩 License

MIT Use at your own risk.
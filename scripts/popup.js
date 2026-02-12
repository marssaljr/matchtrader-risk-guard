const input = document.getElementById("limitInput");
const button = document.getElementById("saveBtn");
const status = document.getElementById("status");

function loadState() {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {

    input.value = state.moneyLimit;
    status.textContent = `Actual limit: ${state.moneyLimit}`;
  });
}

button.addEventListener("click", () => {
  const value = Number(input.value);

  if (!value || value <= 0) {
    status.textContent = "Invalid value.";
    return;
  }

  chrome.runtime.sendMessage({
    type: "SET_LIMIT",
    moneyLimit: value
  }, () => {
    status.textContent = "Limit saved.";
    loadState();
  });
});

loadState();

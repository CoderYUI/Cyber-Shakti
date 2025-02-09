document.addEventListener("DOMContentLoaded", function () {
  const score = document.getElementById("score");
  const output = document.getElementById("output");
  const tipsContainer = document.getElementById("tips-container");

  const fakeTips = `
    <div class="tips-title">🚨 Safety Tips:</div>
    • Don't share or spread this content
    • Report suspicious media
    • Verify the original source
    • Be cautious of manipulated content
  `;

  const realTips = `
    <div class="tips-title">✅ Best Practices:</div>
    • Still verify from trusted sources
    • Consider the context
    • Check publication date
    • Look for official confirmations
  `;

  chrome.runtime.sendMessage({ action: "getResult" }, (response) => {
    if (response) {
      const percentage = (parseFloat(response.best_prediction) * 100).toFixed(2);
      score.textContent = `${percentage}%`;
      output.textContent = response.classification;

      const resultText = document.querySelector(".result-text");
      if (response.classification.includes("Fake")) {
        resultText.classList.add("fake");
        tipsContainer.classList.add("fake");
        tipsContainer.innerHTML = fakeTips;
        document.body.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
      } else {
        resultText.classList.add("real");
        tipsContainer.classList.add("real");
        tipsContainer.innerHTML = realTips;
        document.body.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
      }
    }
  });
});

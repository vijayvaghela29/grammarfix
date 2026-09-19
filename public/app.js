const inputText = document.getElementById("inputText");
const checkBtn = document.getElementById("checkBtn");
const status = document.getElementById("status");
const correctedText = document.getElementById("correctedText");
const explanation = document.getElementById("explanation");

checkBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();

  if (!text) {
    status.textContent = "⚠️ Please enter some text.";
    return;
  }

  checkBtn.disabled = true;
  status.textContent = "⏳ QVAC is checking your text...";

  try {
    const response = await fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    correctedText.textContent = data.corrected;
    explanation.textContent = data.explanation;

    status.textContent = "✅ Checked by local QVAC AI!";
  } catch (error) {
    console.error(error);
    status.textContent = "❌ " + error.message;
  } finally {
    checkBtn.disabled = false;
  }
});
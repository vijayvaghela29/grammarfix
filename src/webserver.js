import express from "express";

import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel
} from "@qvac/sdk";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

let modelId = null;

// Load QVAC model
async function startModel() {
  console.log("🧠 Loading QVAC model...");

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    onProgress: (progress) => {
      console.log(
        `Downloading: ${progress.percentage.toFixed(0)}%`
      );
    }
  });

  console.log("✅ QVAC model loaded!");
}

// Grammar checker API
app.post("/api/check", async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    if (!modelId) {
      return res.status(503).json({
        error: "AI model is still loading. Please try again."
      });
    }

    const prompt = `
You are a careful English grammar checker.

Correct only genuine grammar, spelling, punctuation, and clarity
problems in the user's text.

Do NOT change correct phrases unnecessarily.
Preserve the original meaning.
Do NOT invent errors.

Return exactly this format:

CORRECTED:
<corrected text>

EXPLANATION:
<short explanation of only the changes you actually made>

Text:
${text}
`;

    const result = completion({
      modelId,
      history: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true
    });

    let output = "";

    for await (const token of result.tokenStream) {
      output += token;
    }

    const correctedMatch = output.match(
      /CORRECTED:\s*([\s\S]*?)(?=\nEXPLANATION:|$)/i
    );

    const explanationMatch = output.match(
      /EXPLANATION:\s*([\s\S]*)/i
    );

    const corrected =
      correctedMatch?.[1]?.trim() || output.trim();

    const explanation =
      explanationMatch?.[1]?.trim() ||
      "Grammar corrected by the local QVAC AI model.";

    res.json({
      corrected,
      explanation
    });

  } catch (error) {
    console.error("❌ QVAC error:", error);

    res.status(500).json({
      error: "QVAC failed to process the text."
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 GrammarFix running at http://localhost:${PORT}`);

  try {
    await startModel();
  } catch (error) {
    console.error("❌ Failed to load QVAC model:", error);
  }
});

// Clean shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");

  try {
    if (modelId) {
      await unloadModel({ modelId });
    }
  } catch (error) {
    console.warn("⚠️ Model unload failed; exiting anyway.");
  } finally {
    process.exit(0);
  }
});

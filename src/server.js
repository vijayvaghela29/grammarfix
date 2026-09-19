import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel,
} from "@qvac/sdk";

async function main() {
  console.log("🚀 Starting GrammarFix...");
  console.log("📦 Loading QVAC model...");

  const modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    onProgress: (p) => {
      console.log(`Downloading: ${p.percentage.toFixed(0)}%`);
    },
  });

  console.log("✅ QVAC model loaded!");

  const text =
    "She go to school everyday and don't like maths.";

  const prompt = `
You are an English grammar checker.

Correct the grammar, spelling, punctuation, and sentence structure
of the following sentence.

Return:

CORRECTED:
<corrected sentence>

EXPLANATION:
<short explanation>

Sentence:
${text}
`;

  console.log("🤖 Checking grammar...");

  const result = completion({
    modelId,
    history: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
  });

  let output = "";

  for await (const token of result.tokenStream) {
    process.stdout.write(token);
    output += token;
  }

  console.log("\n\n✅ Grammar check completed!");

  await unloadModel({ modelId });

  console.log("👋 Model unloaded.");
}

main().catch((error) => {
  console.error("\n❌ GrammarFix Error:");
  console.error(error);
});
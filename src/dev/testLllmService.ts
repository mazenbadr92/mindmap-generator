import { buildPrompt } from "../core/services/promptService";
import { generateMindMap } from "../core/services/llmService";

(async () => {
  const prompt = buildPrompt({
    subject: "Biologie",
    topic: "Populationsökologie, Lotka-Volterra-Regeln",
  });

  const mindMap = await generateMindMap(prompt);
  console.dir(mindMap, { depth: null });
})();

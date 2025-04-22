import { buildPrompt } from "../core/services/promptService";

const prompt = buildPrompt({
  subject: "Biologie",
  topic: "Populationsökologie, Lotka-Volterra-Regeln",
});

console.log(prompt);

import { OpenAI } from "openai";
import { GPT_MODELS, GPT_ROLES, MindMap } from "../../types";
import { env } from "../../config/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateMindMap(prompt: string): Promise<MindMap> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODELS.GPT_3_5_TURBO,
      messages: [
        {
          role: GPT_ROLES.USER,
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const message = response.choices[0].message?.content;

    if (!message) {
      throw new Error("No response content received from OpenAI");
    }

    const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : message;

    const parsed = JSON.parse(jsonString.trim());
    return parsed as MindMap;
  } catch (err) {
    console.error("❌ Error calling OpenAI:", err);
    throw err;
  }
}

import { OpenAI } from "openai";
import { MindMap } from "../../types";
import { env } from "../../config/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateMindMap(prompt: string): Promise<MindMap> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const message = response.choices[0].message?.content;

    if (!message) {
      throw new Error("No response content received from OpenAI");
    }

    // Extract JSON from triple-backtick block if present
    const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : message;

    const parsed = JSON.parse(jsonString.trim());
    return parsed as MindMap;
  } catch (err) {
    console.error("❌ Error calling OpenAI:", err);
    throw err;
  }
}

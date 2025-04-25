import { readCSV, writeCSV } from "./csvService";
import { buildPrompt } from "./promptService";
import { generateMindMap } from "./llmService";
import { saveMindMap } from "./fireStoreService";
import { StatusRow, InputRow } from "../../types";
import promiseLimit from "promise-limit";

export async function generateMindMapsFromCSV(
  inputFile: string
): Promise<StatusRow[]> {
  const rows = await readCSV(inputFile);
  const results: StatusRow[] = [];
  const LLM_PROMISES_LIMIT = 5;

  const limit: <T>(fn: () => Promise<T>) => Promise<T> =
    promiseLimit(LLM_PROMISES_LIMIT);

  const tasks: Promise<StatusRow>[] = rows.map((row: InputRow) =>
    limit<StatusRow>(async () => {
      try {
        const prompt = buildPrompt(row);
        const mindMap = await generateMindMap(prompt);
        await saveMindMap(row.subject, row.topic, mindMap);
        return { topic: row.topic, status: "Success" };
      } catch (error) {
        console.error(`❌ Generation error for topic "${row.topic}":`, error);
        return { topic: row.topic, status: "Failure" };
      }
    })
  );

  const taskResults = await Promise.all(tasks);
  results.push(...taskResults);

  await writeCSV(inputFile, results);
  return results;
}

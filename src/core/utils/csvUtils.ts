import csvParser from "csv-parser";
import { InputRow } from "../../types";

export async function parseCsvStream(
  stream: NodeJS.ReadableStream
): Promise<InputRow[]> {
  const results: InputRow[] = [];

  return new Promise((resolve, reject) => {
    const parser = csvParser();

    stream.on("error", (err) => reject(err));

    stream
      .pipe(parser)
      .on("data", (data: Record<string, string>) => {
        if (data.subject && data.topic) {
          results.push({
            subject: data.subject.trim(),
            topic: data.topic.trim(),
          });
        }
      })
      .on("end", () => resolve(results))
      .on("error", (err: Error) => reject(err));
  });
}

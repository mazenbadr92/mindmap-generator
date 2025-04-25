import fsPromises from "fs/promises";
import * as fss from "fs";
import path from "path";
import { Storage } from "@google-cloud/storage";
import { env } from "../../config/env";
import { InputRow, StatusRow } from "../../types";
import csvParser from "csv-parser";
import { format } from "@fast-csv/format";
import { Readable } from "stream";

const isGCS = env.USE_GCS === "true";
const storage = new Storage();
const CSV_BUCKET = env.CSV_BUCKET;

export const parseName = (filename: string) => ({
  input: filename,
  output: `${path.parse(filename).name}_status.csv`,
});

async function parseCsvStream(
  stream: NodeJS.ReadableStream
): Promise<InputRow[]> {
  const results: InputRow[] = [];
  return new Promise((resolve, reject) => {
    (stream as any)
      .pipe(csvParser())
      .on("data", (data: Record<string, string>) => {
        if (data.subject && data.topic) {
          results.push({
            subject: data.subject.trim(),
            topic: data.topic.trim(),
          });
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

export async function readCSV(filename: string): Promise<InputRow[]> {
  const { input } = parseName(filename);

  if (isGCS) {
    const [contents] = await storage
      .bucket(CSV_BUCKET)
      .file(`input/${input}`)
      .download();

    const readable = new Readable();
    readable._read = () => {};
    readable.push(contents);
    readable.push(null);
    return parseCsvStream(readable);
  }
  const LOCAL_INPUT_DIR = env.LOCAL_INPUT_DIR
    ? path.resolve(env.LOCAL_INPUT_DIR)
    : "";

  const filePath = path.join(LOCAL_INPUT_DIR, input);
  const fileStream = fss.createReadStream(filePath);
  return parseCsvStream(fileStream);
}

export async function writeCSV(
  inputFilename: string,
  data: StatusRow[]
): Promise<void> {
  const { output } = parseName(inputFilename);

  if (isGCS) {
    const tempPath = path.join("/tmp", output);
    await writeCsvToFile(tempPath, data);

    await storage.bucket(CSV_BUCKET).upload(tempPath, {
      destination: `output/${output}`,
    });

    await fsPromises.unlink(tempPath);
  } else {
    const LOCAL_OUTPUT_DIR = env.LOCAL_OUTPUT_DIR
      ? path.resolve(env.LOCAL_OUTPUT_DIR)
      : "";
    const localPath = path.join(LOCAL_OUTPUT_DIR, output);
    await writeCsvToFile(localPath, data);
  }
}

export function writeCsvToFile(
  filePath: string,
  data: StatusRow[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = fss.createWriteStream(filePath);
    const csvStream = format({ headers: ["topic", "status"] });

    csvStream.pipe(ws).on("finish", resolve).on("error", reject);
    data.forEach((row) => csvStream.write(row));
    csvStream.end();
  });
}

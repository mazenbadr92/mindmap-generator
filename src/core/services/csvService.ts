import fs from "fs/promises";
import * as fss from "fs";
import path from "path";
import { Storage } from "@google-cloud/storage";
import { env } from "../../config/env";
import { InputRow, StatusRow } from "../../types";
import csvParser from "csv-parser";
import { format } from "@fast-csv/format";

const isGCS = env.USE_GCS === "true";
const storage = new Storage();
const CSV_BUCKET = env.CSV_BUCKET;

const LOCAL_INPUT_DIR = path.resolve(__dirname, "../../../input");
const LOCAL_OUTPUT_DIR = path.resolve(__dirname, "../../../output");

const parseName = (filename: string) => ({
  input: filename,
  output: `${path.parse(filename).name}_status.csv`,
});

export async function readCSV(filename: string): Promise<InputRow[]> {
  const { input } = parseName(filename);

  if (isGCS) {
    const [contents] = await storage
      .bucket(CSV_BUCKET)
      .file(`input/${input}`)
      .download();

    return parseCsvBuffer(contents);
  }

  return parseCsvFile(path.join(LOCAL_INPUT_DIR, input));
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

    await fs.unlink(tempPath);
  } else {
    const localPath = path.join(LOCAL_OUTPUT_DIR, output);
    await writeCsvToFile(localPath, data);
  }
}

function parseCsvBuffer(buffer: Buffer): Promise<InputRow[]> {
  const results: InputRow[] = [];

  return new Promise((resolve, reject) => {
    const { Readable } = require("stream");
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    readable
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

function parseCsvFile(filePath: string): Promise<InputRow[]> {
  const results: InputRow[] = [];

  return new Promise((resolve, reject) => {
    fss
      .createReadStream(filePath)
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

function writeCsvToFile(filePath: string, data: StatusRow[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = fss.createWriteStream(filePath);
    const csvStream = format({ headers: ["topic", "status"] });

    csvStream.pipe(ws).on("finish", resolve).on("error", reject);
    data.forEach((row) => csvStream.write(row));
    csvStream.end();
  });
}

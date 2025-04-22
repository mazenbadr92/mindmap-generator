import { readCSV, writeCSV } from "./csvService";
import * as fsPromises from "fs/promises";
import * as fss from "fs";
import { InputRow, StatusRow } from "../../types";

const mockDownload = jest.fn();
const mockUpload = jest.fn();
const mockFile = jest.fn(() => ({
  download: mockDownload,
  upload: mockUpload,
}));
const mockBucket = jest.fn(() => ({
  file: mockFile,
}));
const mockStorage = jest.fn(() => ({
  bucket: mockBucket,
}));

jest.mock("@google-cloud/storage", () => ({
  Storage: mockStorage,
  __esModule: true,
}));

jest.mock("fs/promises");
jest.mock("fs");
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  resolve: jest.fn((...args) => args.join("/")),
  join: jest.fn((...args) => args.join("/")),
  parse: jest.fn(() => ({ name: "input" })),
}));

jest.mock("../../config/env", () => ({
  env: {
    USE_GCS: "false",
    CSV_BUCKET: "test-bucket",
    GCP_PROJECT_ID: "test-project",
    OPENAI_API_KEY: "sk-fake",
    PORT: "8080",
  },
}));

jest.spyOn(process, "exit").mockImplementation((() => {}) as any);

const mockCSV = `subject,topic\nMath,Algebra\nScience,Physics\nInvalidRow\n`;
const mockRows: InputRow[] = [
  { subject: "Math", topic: "Algebra" },
  { subject: "Science", topic: "Physics" },
];

describe("csvService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readCSV - local", () => {
    it("parses CSV from local file system", async () => {
      const readable = require("stream").Readable.from([mockCSV]);
      (fss.createReadStream as jest.Mock).mockReturnValue(readable);

      const result = await readCSV("input.csv");
      expect(result).toEqual(mockRows);
    });

    it("throws error if CSV read fails", async () => {
      (fss.createReadStream as jest.Mock).mockImplementation(() => {
        const { Readable } = require("stream");
        const stream = new Readable({ read() {} });
        process.nextTick(() => stream.emit("error", new Error("Read error")));
        return stream;
      });

      await expect(readCSV("input.csv")).rejects.toThrow("Read error");
    });
  });

  describe("readCSV - GCS", () => {
    it("parses CSV from GCS", async () => {
      process.env.USE_GCS = "true";
      mockDownload.mockResolvedValue([Buffer.from(mockCSV)]);

      const result = await readCSV("input.csv");
      expect(result).toEqual(mockRows);
    });

    it("throws error if GCS download fails", async () => {
      process.env.USE_GCS = "true";
      mockDownload.mockRejectedValue(new Error("Download failed"));

      await expect(readCSV("input.csv")).rejects.toThrow("Download failed");
    });
  });

  describe("writeCSV", () => {
    const statusRows: StatusRow[] = [
      { topic: "Algebra", status: "Success" },
      { topic: "Physics", status: "Failure" },
    ];

    it("writes CSV to local file system", async () => {
      const mockWriteStream = {
        on: jest.fn().mockImplementation(function (this: any, event: string, cb: () => void) {
          if (event === "finish") setImmediate(cb);
          return this;
        }),
        end: jest.fn(),
      };
      (fss.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      await writeCSV("input.csv", statusRows);
      expect(fss.createWriteStream).toHaveBeenCalled();
    });

    it("writes CSV to GCS", async () => {
      process.env.USE_GCS = "true";
      (fsPromises.unlink as jest.Mock).mockResolvedValue(undefined);

      const mockWriteStream = {
        on: jest.fn().mockImplementation(function (this: any, event: string, cb: () => void) {
          if (event === "finish") setImmediate(cb);
          return this;
        }),
        end: jest.fn(),
      };
      (fss.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      mockUpload.mockResolvedValue(undefined);

      await writeCSV("input.csv", statusRows);
      expect(mockUpload).toHaveBeenCalled();
      expect(fsPromises.unlink).toHaveBeenCalled();
    });
  });
});
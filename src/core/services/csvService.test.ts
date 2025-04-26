import { parseName, writeCsvToFile } from "./csvService";
import * as fss from "fs";
import { format } from "@fast-csv/format";
import { Readable, Writable } from "stream";
import { StatusRow } from "../../types";

type MockOnCall = [event: string, handler: (...args: any[]) => void];

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const readable = new Readable({
      read() {
        this.push("subject,topic\nMath,Algebra\n");
        this.push(null);
      },
    });
    return readable;
  }),
  createWriteStream: jest.fn(() => {
    const writable = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    (writable as any).pipe = function () {
      return this;
    };
    (writable as any).on = function (event: string, callback: any) {
      if (event === "finish") {
        setImmediate(callback);
      }
      return this;
    };

    return writable;
  }),
}));

jest.mock("fs/promises", () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@fast-csv/format", () => {
  return {
    format: jest.fn(() => {
      const { PassThrough } = require("stream");

      const csvStream = new PassThrough();
      const realWrite = csvStream.write.bind(csvStream);

      csvStream.write = (chunk: any) => {
        if (typeof chunk === "object") {
          const line = `${chunk.topic},${chunk.status}\n`;
          return realWrite(Buffer.from(line));
        }
        return realWrite(chunk);
      };

      return csvStream;
    }),
  };
});

const servicePath = "./csvService";

describe("parseName", () => {
  it("should correctly parse the filename and generate output filename", () => {
    expect(parseName("topics.csv")).toEqual({
      input: "topics.csv",
      output: "topics_status.csv",
    });
  });

  it("should handle filenames with multiple dots", () => {
    expect(parseName("my.topics.csv")).toEqual({
      input: "my.topics.csv",
      output: "my.topics_status.csv",
    });
  });

  it("should handle filenames without extension", () => {
    expect(parseName("topics")).toEqual({
      input: "topics",
      output: "topics_status.csv",
    });
  });
});

describe("writeCsvToFile", () => {
  let mockWriteStream: any;
  let mockCsvStream: any;

  beforeEach(() => {
    mockWriteStream = {
      on: jest.fn().mockReturnThis(),
    };

    mockCsvStream = {
      pipe: jest.fn().mockReturnThis(),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn().mockReturnThis(),
    };

    (fss.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (format as unknown as jest.Mock).mockReturnValue(mockCsvStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve when the write finishes", async () => {
    const promise = writeCsvToFile("test.csv", [
      { topic: "Topic 1", status: "Success" },
      { topic: "Topic 2", status: "Failure" },
    ]);

    const finishHandler = (mockCsvStream.on.mock.calls as MockOnCall[]).find(
      ([event]) => event === "finish"
    )?.[1];

    finishHandler?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("should reject if an error occurs", async () => {
    const promise = writeCsvToFile("test.csv", [
      { topic: "T", status: "Failure" },
    ]);

    const errorHandler = (mockCsvStream.on.mock.calls as MockOnCall[]).find(
      ([event]) => event === "error"
    )?.[1];

    errorHandler?.(new Error("mock error"));

    await expect(promise).rejects.toThrow("mock error");
  });
});

describe("readCSV", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should read CSV locally when USE_GCS is false", async () => {
    process.env.USE_GCS = "false";
    process.env.LOCAL_INPUT_DIR = "/fake/input";

    const mockParseCsvStream = jest
      .fn()
      .mockResolvedValue([{ subject: "Math", topic: "Algebra" }]);

    jest.doMock("../utils/csvUtils", () => ({
      parseCsvStream: mockParseCsvStream,
    }));

    const fss = require("fs");
    const mockStream = new Readable({ read() {} });
    jest.spyOn(fss, "createReadStream").mockReturnValue(mockStream as any);

    const { readCSV } = require(servicePath);
    const rows = await readCSV("topics.csv");

    expect(fss.createReadStream).toHaveBeenCalledWith(
      expect.stringContaining("topics.csv")
    );
    expect(mockParseCsvStream).toHaveBeenCalledWith(mockStream);
    expect(rows).toEqual([{ subject: "Math", topic: "Algebra" }]);
  });

  it("should read CSV from GCS when USE_GCS is true", async () => {
    process.env.USE_GCS = "true";

    const mockParseCsvStream = jest
      .fn()
      .mockResolvedValue([{ subject: "Science", topic: "Physics" }]);

    jest.doMock("../utils/csvUtils", () => ({
      parseCsvStream: mockParseCsvStream,
    }));

    const fakeDownloadBuffer = Buffer.from("file content");
    const mockDownload = jest.fn().mockResolvedValue([fakeDownloadBuffer]);
    const mockFile = jest.fn(() => ({ download: mockDownload }));
    const mockBucket = jest.fn(() => ({ file: mockFile }));

    jest.doMock("@google-cloud/storage", () => ({
      Storage: jest.fn(() => ({
        bucket: mockBucket,
      })),
    }));

    const { readCSV } = require(servicePath);
    const rows = await readCSV("gcsfile.csv");

    expect(mockBucket).toHaveBeenCalled();
    expect(mockFile).toHaveBeenCalledWith("input/gcsfile.csv");
    expect(mockDownload).toHaveBeenCalled();
    expect(mockParseCsvStream).toHaveBeenCalled();
    expect(rows).toEqual([{ subject: "Science", topic: "Physics" }]);
  });
});

describe("writeCSV", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };

    jest.mock("@google-cloud/storage", () => {
      return {
        Storage: jest.fn(() => ({
          bucket: jest.fn(() => ({
            upload: jest.fn().mockResolvedValue(undefined),
            file: jest.fn(() => ({
              download: jest
                .fn()
                .mockResolvedValue([Buffer.from("file content")]),
            })),
          })),
        })),
      };
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should write CSV locally when USE_GCS is false", async () => {
    process.env.USE_GCS = "false";
    process.env.LOCAL_OUTPUT_DIR = "/fake/output";

    const { writeCSV } = require(servicePath);

    const data: StatusRow[] = [{ topic: "Math", status: "Success" }];
    await expect(writeCSV("topics.csv", data)).resolves.toBeUndefined();
  });

  it("should write CSV and upload to GCS when USE_GCS is true", async () => {
    process.env.USE_GCS = "true";
    process.env.CSV_BUCKET = "my-bucket";

    const { writeCSV } = require("./csvService");

    const data: StatusRow[] = [{ topic: "Science", status: "Failure" }];
    await expect(writeCSV("science.csv", data)).resolves.toBeUndefined();
  });
});

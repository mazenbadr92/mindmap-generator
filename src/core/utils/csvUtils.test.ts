import { parseCsvStream } from "./csvUtils";
import { Readable } from "stream";

describe("parseCsvStream", () => {
  it("should parse valid CSV data", async () => {
    const readable = new Readable({
      read() {
        this.push("subject,topic\nMath,Algebra\nScience,Physics\n");
        this.push(null);
      },
    });

    const result = await parseCsvStream(readable);
    expect(result).toEqual([
      { subject: "Math", topic: "Algebra" },
      { subject: "Science", topic: "Physics" },
    ]);
  });

  it("should reject if stream emits an error", async () => {
    const readable = new Readable({
      read() {
        setImmediate(() => {
          this.destroy(new Error("stream error"));
        });
      },
    });

    await expect(parseCsvStream(readable)).rejects.toThrow("stream error");
  });

  it("should skip lines missing subject or topic", async () => {
    const readable = new Readable({
      read() {
        this.push("subject,topic\nMath,Algebra\n,Physics\nScience,\n");
        this.push(null);
      },
    });

    const result = await parseCsvStream(readable);
    expect(result).toEqual([{ subject: "Math", topic: "Algebra" }]);
  });
});

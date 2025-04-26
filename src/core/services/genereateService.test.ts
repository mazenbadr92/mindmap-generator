describe("generateMindMapsFromCSV", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    console.error;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetModules();
    consoleErrorSpy.mockRestore();
  });

  it("processes all rows successfully and writes results", async () => {
    const rows = [
      { subject: "sub1", topic: "top1" },
      { subject: "sub2", topic: "top2" },
    ];
    const mockReadCSV = jest.fn().mockResolvedValue(rows);
    const mockBuildPrompt = jest.fn(
      (row) => `prompt:${row.subject}-${row.topic}`
    );
    const mockGenerateMindMap = jest
      .fn()
      .mockResolvedValue({ nodes: [], edges: [] });
    const mockSaveMindMap = jest.fn().mockResolvedValue(undefined);
    const mockWriteCSV = jest.fn().mockResolvedValue(undefined);

    jest.doMock("./csvService", () => ({
      readCSV: mockReadCSV,
      writeCSV: mockWriteCSV,
    }));
    jest.doMock("./promptService", () => ({ buildPrompt: mockBuildPrompt }));
    jest.doMock("./llmService", () => ({
      generateMindMap: mockGenerateMindMap,
    }));
    jest.doMock("./fireStoreService", () => ({ saveMindMap: mockSaveMindMap }));

    const { generateMindMapsFromCSV } = require("./generateService");
    const result = await generateMindMapsFromCSV("input.csv");

    expect(mockReadCSV).toHaveBeenCalledWith("input.csv");
    expect(mockBuildPrompt).toHaveBeenCalledTimes(rows.length);
    rows.forEach((row) => {
      expect(mockBuildPrompt).toHaveBeenCalledWith(row);
      expect(mockGenerateMindMap).toHaveBeenCalledWith(
        `prompt:${row.subject}-${row.topic}`
      );
      expect(mockSaveMindMap).toHaveBeenCalledWith(row.subject, row.topic, {
        nodes: [],
        edges: [],
      });
    });
    expect(result).toEqual([
      { topic: "top1", status: "Success" },
      { topic: "top2", status: "Success" },
    ]);
    expect(mockWriteCSV).toHaveBeenCalledWith("input.csv", result);
  });

  it("marks failures when generation errors occur", async () => {
    const rows = [
      { subject: "a", topic: "x" },
      { subject: "b", topic: "y" },
    ];
    const mockReadCSV = jest.fn().mockResolvedValue(rows);
    const mockBuildPrompt = jest.fn().mockReturnValue("p1");
    const mockGenerateMindMap = jest
      .fn()
      .mockResolvedValueOnce({ nodes: [], edges: [] })
      .mockRejectedValueOnce(new Error("LLM failure"));
    const mockSaveMindMap = jest.fn().mockResolvedValue(undefined);
    const mockWriteCSV = jest.fn().mockResolvedValue(undefined);

    jest.doMock("./csvService", () => ({
      readCSV: mockReadCSV,
      writeCSV: mockWriteCSV,
    }));
    jest.doMock("./promptService", () => ({ buildPrompt: mockBuildPrompt }));
    jest.doMock("./llmService", () => ({
      generateMindMap: mockGenerateMindMap,
    }));
    jest.doMock("./fireStoreService", () => ({ saveMindMap: mockSaveMindMap }));

    const { generateMindMapsFromCSV } = require("./generateService");
    const result = await generateMindMapsFromCSV("file.csv");

    expect(result).toEqual([
      { topic: "x", status: "Success" },
      { topic: "y", status: "Failure" },
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generation error for topic "y"'),
      expect.any(Error)
    );
    expect(mockWriteCSV).toHaveBeenCalledWith("file.csv", result);
  });
});

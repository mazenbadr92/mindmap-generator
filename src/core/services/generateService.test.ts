import { generateMindMapsFromCSV } from "./generateService";
import * as csvService from "./csvService";
import * as promptService from "./promptService";
import * as llmService from "./llmService";
import * as firestoreService from "./fireStoreService";
import { InputRow, StatusRow, MindMap } from "../../types";

// Mocks
jest.mock("./csvService");
jest.mock("./promptService");
jest.mock("./llmService");
jest.mock("./fireStoreService");

const mockInputRows: InputRow[] = [
  { subject: "Math", topic: "Algebra" },
  { subject: "Science", topic: "Biology" },
];

const mockMindMap: MindMap = {
  mainTopic: "Algebra",
  subTopics: [],
};

describe("generateMindMapsFromCSV", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (csvService.readCSV as jest.Mock).mockResolvedValue(mockInputRows);
    (promptService.buildPrompt as jest.Mock).mockImplementation(
      (row: InputRow) => `Prompt for ${row.topic}`
    );
    (llmService.generateMindMap as jest.Mock).mockResolvedValue(mockMindMap);
    (firestoreService.saveMindMap as jest.Mock).mockResolvedValue(undefined);
    (csvService.writeCSV as jest.Mock).mockResolvedValue(undefined);
  });

  it("should generate mind maps and write statuses", async () => {
    const results: StatusRow[] = await generateMindMapsFromCSV("topics.csv");

    expect(csvService.readCSV).toHaveBeenCalledWith("topics.csv");
    expect(promptService.buildPrompt).toHaveBeenCalledTimes(2);
    expect(llmService.generateMindMap).toHaveBeenCalledTimes(2);
    expect(firestoreService.saveMindMap).toHaveBeenCalledTimes(2);
    expect(csvService.writeCSV).toHaveBeenCalledWith("topics.csv", results);

    expect(results).toEqual([
      { topic: "Algebra", status: "Success" },
      { topic: "Biology", status: "Success" },
    ]);
  });

  it("should handle errors gracefully and mark failures", async () => {
    (llmService.generateMindMap as jest.Mock).mockImplementationOnce(() => {
      throw new Error("LLM failure");
    });

    const results = await generateMindMapsFromCSV("topics.csv");

    expect(results).toEqual([
      { topic: "Algebra", status: "Failure" },
      { topic: "Biology", status: "Success" },
    ]);
  });
});

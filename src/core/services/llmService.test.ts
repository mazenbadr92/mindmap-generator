import { generateMindMap } from "./llmService";
import { MindMap } from "../../types";

const mockCreate = jest.fn();

jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe("generateMindMap", () => {
  const prompt = "Generate a mind map about photosynthesis";

  const mockMindMap: MindMap = {
    mainTopic: "Photosynthesis",
    subTopics: [
      {
        title: "Title",
        description: "Description",
      },
    ],
  };

  it("parses a valid OpenAI response wrapped in triple backticks", async () => {
    const responseText = "```json\n" + JSON.stringify(mockMindMap) + "\n```";

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: responseText,
          },
        },
      ],
    });

    const result = await generateMindMap(prompt);
    expect(result).toEqual(mockMindMap);
  });

  it("parses a valid OpenAI response without triple backticks", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockMindMap),
          },
        },
      ],
    });

    const result = await generateMindMap(prompt);
    expect(result).toEqual(mockMindMap);
  });

  it("throws an error if OpenAI response has no message content", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    });

    await expect(generateMindMap(prompt)).rejects.toThrow(
      "No response content received from OpenAI"
    );
  });

  it("throws an error if OpenAI throws", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API down"));
    await expect(generateMindMap(prompt)).rejects.toThrow("API down");
  });
});

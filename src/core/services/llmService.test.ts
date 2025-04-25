// src/core/services/llmService.test.ts

// 1) Ensure env var before module load
process.env.OPENAI_API_KEY = "test-key";

import { GPT_MODELS, GPT_ROLES } from "../../types";

describe("generateMindMap", () => {
  let mockCreate: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("parses JSON inside ```json``` fences", async () => {
    // Arrange: mock OpenAI client
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '```json {"foo":"bar"} ```' } }],
    });
    jest.mock("openai", () => ({
      OpenAI: jest.fn(() => ({
        chat: { completions: { create: mockCreate } },
      })),
    }));

    // Act
    const { generateMindMap } = require("./llmService");
    const result = await generateMindMap("my-prompt");

    // Assert
    expect(mockCreate).toHaveBeenCalledWith({
      model: GPT_MODELS.GPT_3_5_TURBO,
      messages: [{ role: GPT_ROLES.USER, content: "my-prompt" }],
      temperature: 0.7,
    });
    expect(result).toEqual({ foo: "bar" });
  });

  it("parses raw JSON when no code fences present", async () => {
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '{"a":1, "b":2}' } }],
    });
    jest.mock("openai", () => ({
      OpenAI: jest.fn(() => ({
        chat: { completions: { create: mockCreate } },
      })),
    }));

    const { generateMindMap } = require("./llmService");
    const result = await generateMindMap("prompt2");

    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("throws an error when no message content received", async () => {
    mockCreate = jest.fn().mockResolvedValue({ choices: [{ message: {} }] });
    jest.mock("openai", () => ({
      OpenAI: jest.fn(() => ({
        chat: { completions: { create: mockCreate } },
      })),
    }));

    const { generateMindMap } = require("./llmService");
    await expect(generateMindMap("p")).rejects.toThrow(
      "No response content received from OpenAI"
    );
  });

  it("logs and rethrows on JSON parse failure", async () => {
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: "not-a-json" } }],
    });
    jest.mock("openai", () => ({
      OpenAI: jest.fn(() => ({
        chat: { completions: { create: mockCreate } },
      })),
    }));

    const { generateMindMap } = require("./llmService");
    await expect(generateMindMap("p")).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ Error calling OpenAI:",
      expect.any(Error)
    );
  });
});

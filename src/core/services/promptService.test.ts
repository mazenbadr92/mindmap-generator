// src/core/services/promptService.test.ts

import { buildPrompt } from "./promptService";
import { MindMap } from "../../types";

describe("promptService.buildPrompt", () => {
  const exampleSubject = "Mathematics";
  const exampleTopic = "Algebra";
  let prompt: string;

  beforeAll(() => {
    prompt = buildPrompt({ subject: exampleSubject, topic: exampleTopic });
  });

  it("returns a non-empty string", () => {
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("starts with the teacher introduction including subject", () => {
    expect(
      prompt.startsWith(`You are a professional teacher in ${exampleSubject}.`)
    ).toBe(true);
  });

  it("mentions the focus on the given topic", () => {
    expect(prompt).toContain(`with the focus on the topic \"${exampleTopic}\"`);
  });

  it("includes the JSON code fence with the correct example structure", () => {
    // Extract content between ```json and ```
    const fenceRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = prompt.match(fenceRegex);
    expect(match).not.toBeNull();

    const jsonBlock = match![1];
    // Parse the JSON block
    const parsed: MindMap = JSON.parse(jsonBlock);
    // The example structure should have mainTopic === exampleTopic
    expect(parsed).toMatchObject({
      mainTopic: exampleTopic,
      subTopics: expect.any(Array),
    });
    // Check that subTopics array has the expected shape
    expect(parsed.subTopics.length).toBe(2);
    parsed.subTopics.forEach((st) => {
      expect(typeof st.title).toBe("string");
      expect(typeof st.description).toBe("string");
    });
  });

  it("does not include leading or trailing whitespace", () => {
    expect(prompt).toBe(prompt.trim());
  });
});

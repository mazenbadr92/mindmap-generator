import { buildPrompt } from "./promptService";
import { InputRow, MindMap } from "../../types";

describe("buildPrompt", () => {
  const input: InputRow = {
    subject: "Mathematics",
    topic: "Algebra",
  };

  it("should return a well-formatted prompt with correct subject and topic", () => {
    const prompt = buildPrompt(input);

    expect(typeof prompt).toBe("string");
    expect(prompt).toContain("You are a professional teacher in Mathematics");
    expect(prompt).toContain(
      'The mind map should feature sub-topics of the topic "Algebra"'
    );
    expect(prompt).toContain(`"mainTopic": "Algebra"`);
    expect(prompt).toContain(`"subTopics"`);

    // Check that only one code block is included and it's JSON
    const codeBlockMatches = prompt.match(/```json\s*([\s\S]*?)\s*```/);
    expect(codeBlockMatches).not.toBeNull();

    // Try to parse the embedded JSON to confirm it's valid
    const parsedJson = JSON.parse(codeBlockMatches![1]);
    const example: MindMap = {
      mainTopic: "Algebra",
      subTopics: [
        {
          title: "Subtopic Title 1",
          description: "Brief explanation of the subtopic.",
        },
        {
          title: "Subtopic Title 2",
          description: "Another explanation of a different subtopic.",
        },
      ],
    };

    expect(parsedJson).toEqual(example);
  });
});

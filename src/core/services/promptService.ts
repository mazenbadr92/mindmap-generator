import { InputRow, MindMap } from "../../types";

export function buildPrompt({ subject, topic }: InputRow): string {
  const dataStructureExample: MindMap = {
    mainTopic: topic,
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

  const prompt = `
You are a professional teacher in ${subject}.
Your goal is to generate a mind map for the subject above with the focus on the topic "${topic}" so that a student can improve their understanding of ${subject} and "${topic}" while using that mind map.
The mind map should feature sub-topics of the topic "${topic}" and no other content.
The result of your work must be a mind map in the form of JSON using the following data structure:

\`\`\`json
${JSON.stringify(dataStructureExample, null, 2)}
\`\`\`

The JSON structure above must be strictly followed in your response.
Do not include any explanations or additional text—only return valid JSON.
`;

  return prompt.trim();
}

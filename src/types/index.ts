export interface InputRow {
  subject: string;
  topic: string;
}

export type Status = "Success" | "Failure";

export interface StatusRow {
  topic: string;
  status: Status;
}

export interface MindMapNode {
  title: string;
  description: string;
}

export interface MindMap {
  mainTopic: string;
  subTopics: MindMapNode[];
}

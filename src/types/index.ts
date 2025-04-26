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

export enum GPT_MODELS {
  GPT_3_5_TURBO = "gpt-3.5-turbo",
}

export enum GPT_ROLES {
  USER = "user",
}

export interface MindMapData {
  id: string;
  subject: string;
  topic: string;
  generatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  mindMap: {
    mainTopic: string;
    subTopics: {
      title: string;
      description: string;
    }[];
  };
}
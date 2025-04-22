import { saveMindMap, getMindMaps } from "./fireStoreService";
import { MindMap } from "../../types";

const firestoreInstance = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({ set: jest.fn() })),
    where: jest.fn(function () {
      return this;
    }),
    get: jest.fn(),
  })),
};

jest.mock("@google-cloud/firestore", () => {
  return {
    Firestore: jest.fn(() => firestoreInstance),
    Timestamp: { now: jest.fn(() => "mock-timestamp") },
  };
});

describe("fireStoreService", () => {
  const sampleMindMap: MindMap = {
    mainTopic: "Main Topic",
    subTopics: [
      {
        title: "Sub Topic",
        description: "Description",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GCP_PROJECT_ID = "test-project";
  });

  describe("saveMindMap", () => {
    it("should save mind map to Firestore with correct ID and structure", async () => {
      await saveMindMap("Science", "Biology", sampleMindMap);

      expect(firestoreInstance.collection).toHaveBeenCalledWith("mindmaps");
      expect(firestoreInstance.collection().doc).toHaveBeenCalledWith(
        "science--biology"
      );
      expect(firestoreInstance.collection().doc().set).toHaveBeenCalledWith({
        subject: "Science",
        topic: "Biology",
        generatedAt: "mock-timestamp",
        mindMap: sampleMindMap,
      });
    });
  });

  describe("getMindMaps", () => {
    it("should return all mindmaps with no filters", async () => {
      const docs = [
        { id: "1", data: () => ({ subject: "Math", topic: "Algebra" }) },
        { id: "2", data: () => ({ subject: "Science", topic: "Physics" }) },
      ];

      firestoreInstance.collection().get.mockResolvedValue({ docs });

      const result = await getMindMaps();
      expect(result).toEqual([
        { id: "1", subject: "Math", topic: "Algebra" },
        { id: "2", subject: "Science", topic: "Physics" },
      ]);
    });

    it("should apply subject and topic filters", async () => {
      await getMindMaps({ subject: "Math", topic: "Geometry" });
      const collection = firestoreInstance.collection();

      expect(collection.where).toHaveBeenCalledWith("subject", "==", "Math");
      expect(collection.where).toHaveBeenCalledWith("topic", "==", "Geometry");
      expect(collection.get).toHaveBeenCalled();
    });
  });
});

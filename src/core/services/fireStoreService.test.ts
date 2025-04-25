// src/core/services/fireStoreService.test.ts

// Ensure env var is set before module load
process.env.GCP_PROJECT_ID = "test-project";

describe("fireStoreService", () => {
  // Mocks for Firestore and Timestamp
  const setMock = jest.fn().mockResolvedValue(undefined);
  const getMock = jest.fn().mockResolvedValue({
    docs: [
      {
        id: "id1",
        data: () => ({
          subject: "s1",
          topic: "t1",
          generatedAt: "g",
          mindMap: {},
        }),
      },
    ],
  });
  const docMock = jest.fn(() => ({ set: setMock }));
  const whereMock = jest.fn(function (this: any) {
    return this;
  });
  const collectionMock = jest.fn(() => ({
    doc: docMock,
    where: whereMock,
    get: getMock,
  }));
  const FirestoreMock = jest.fn(() => ({ collection: collectionMock }));
  const TimestampMock = { now: jest.fn(() => "ts") };

  beforeEach(() => {
    jest.resetModules();
    jest.mock("@google-cloud/firestore", () => ({
      Firestore: FirestoreMock,
      Timestamp: TimestampMock,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("saveMindMap", () => {
    it("creates doc with correct ID and payload", async () => {
      const { saveMindMap } = require("./fireStoreService");
      const data = { foo: "bar" } as any;
      await saveMindMap("Subject With Spaces", "Topic", data);

      expect(FirestoreMock).toHaveBeenCalledWith({ projectId: "test-project" });
      expect(collectionMock).toHaveBeenCalledWith("mindmaps");
      expect(docMock).toHaveBeenCalledWith("subject-with-spaces--topic");
      expect(setMock).toHaveBeenCalledWith({
        subject: "Subject With Spaces",
        topic: "Topic",
        generatedAt: "ts",
        mindMap: data,
      });
    });
  });

  describe("getMindMaps", () => {
    it("returns all docs when no filter provided", async () => {
      const { getMindMaps } = require("./fireStoreService");
      const result = await getMindMaps();
      expect(collectionMock).toHaveBeenCalledWith("mindmaps");
      expect(whereMock).not.toHaveBeenCalled();
      expect(getMock).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: "id1",
          subject: "s1",
          topic: "t1",
          generatedAt: "g",
          mindMap: {},
        },
      ]);
    });

    it("applies subject filter", async () => {
      const { getMindMaps } = require("./fireStoreService");
      await getMindMaps({ subject: "S" });
      expect(whereMock).toHaveBeenCalledWith("subject", "==", "S");
      expect(whereMock).toHaveBeenCalledTimes(1);
    });

    it("applies topic filter", async () => {
      const { getMindMaps } = require("./fireStoreService");
      await getMindMaps({ topic: "T" });
      expect(whereMock).toHaveBeenCalledWith("topic", "==", "T");
      expect(whereMock).toHaveBeenCalledTimes(1);
    });

    it("applies both filters in sequence", async () => {
      const { getMindMaps } = require("./fireStoreService");
      await getMindMaps({ subject: "S", topic: "T" });
      expect(whereMock).toHaveBeenCalledWith("subject", "==", "S");
      expect(whereMock).toHaveBeenCalledWith("topic", "==", "T");
      expect(whereMock).toHaveBeenCalledTimes(2);
    });
  });
});

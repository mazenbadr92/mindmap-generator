import { Firestore, Timestamp } from "@google-cloud/firestore";
import { MindMap } from "../../types";
import { env } from "../../config/env";

const firestore = new Firestore({
  projectId: env.GCP_PROJECT_ID,
});

const collectionName = "mindmaps";

export async function saveMindMap(
  subject: string,
  topic: string,
  data: MindMap
): Promise<void> {
  const id = `${subject}--${topic}`.replace(/\s+/g, "-").toLowerCase();

  await firestore.collection(collectionName).doc(id).set({
    subject,
    topic,
    generatedAt: Timestamp.now(),
    mindMap: data,
  });
}

export async function getMindMaps(filter?: {
  subject?: string;
  topic?: string;
}): Promise<any[]> {
  let query = firestore.collection("mindmaps") as FirebaseFirestore.Query;

  if (filter?.subject) {
    query = query.where("subject", "==", filter.subject);
  }

  if (filter?.topic) {
    query = query.where("topic", "==", filter.topic);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

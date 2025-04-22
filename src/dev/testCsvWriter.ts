import { writeCSV } from "../core/services/csvService";
import { StatusRow } from "../types";

const mockData: StatusRow[] = [
  { topic: "Populationsökologie, Lotka-Volterra-Regeln", status: "Success" },
  { topic: "Frühmittelalter, Karl der Große", status: "Failure" },
];

(async () => {
  await writeCSV("topics", mockData);
  console.log("Output CSV written successfully.");
})();

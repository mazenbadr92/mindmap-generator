import { readCSV } from "../core/services/csvService";

(async () => {
  const data = await readCSV("topics.csv");
  console.log(data);
})();

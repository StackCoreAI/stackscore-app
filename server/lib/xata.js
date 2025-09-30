// server/lib/xata.js
import "dotenv/config";
import { XataClient } from "../../src/xata.js";

let _xata;

export function getXataClientServer() {
  if (_xata) return _xata;

  // scrub any overrides the SDK might read
  delete process.env.XATA_BRANCH;
  delete process.env.XATA_DATABASE_URL;
  delete process.env.XATA_WORKSPACE_URL;

  const apiKey = process.env.XATA_API_KEY;
  if (!apiKey) throw new Error("XATA_API_KEY is missing in .env");

  _xata = new XataClient({
    apiKey,
    databaseURL:
      "https://Jey-Fam-s-workspace-qpe9en.us-east-1.xata.sh/db/stackscore_core:main",
    branch: "main", // explicit—stops the SDK’s branch warning
  });

  return _xata;
}

export const xata = getXataClientServer();

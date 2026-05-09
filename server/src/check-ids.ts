import { query } from "./lib/database.js";
import dotenv from "dotenv";
dotenv.config();

async function checkIds() {
  const questions = await query('SELECT id, "examId" FROM "QuestionStructures"');
  console.log("Questions in DB:");
  console.log(JSON.stringify(questions, null, 2));
}

checkIds().catch(console.error);

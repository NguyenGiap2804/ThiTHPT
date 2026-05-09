import { query } from "./lib/database.js";
import dotenv from "dotenv";
dotenv.config();

async function checkConstraints() {
  const constraints = await query(`
    SELECT conname, confrelid::regclass as ref_table, conkey 
    FROM pg_constraint 
    WHERE conrelid = '"AttemptAnswers"'::regclass;
  `);
  console.log("Constraints for AttemptAnswers:");
  console.log(JSON.stringify(constraints, null, 2));

  const questions = await query('SELECT id FROM "QuestionStructures" LIMIT 5');
  console.log("Sample Question IDs:");
  console.log(JSON.stringify(questions, null, 2));
}

checkConstraints().catch(console.error);

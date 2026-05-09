import { query, queryOne } from "./lib/database.js";

async function checkData() {
  try {
    const exams = await query('SELECT count(*) as count FROM "Exams"');
    console.log("EXAMS COUNT:", exams[0].count);

    const questions = await query('SELECT count(*) as count FROM "QuestionStructures"');
    console.log("QUESTIONS COUNT:", questions[0].count);

    const subjects = await query('SELECT count(*) as count FROM "Subjects"');
    console.log("SUBJECTS COUNT:", subjects[0].count);

    const users = await query('SELECT id, email, role FROM "Users"');
    console.log("USERS:", JSON.stringify(users, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Check data failed:", err);
    process.exit(1);
  }
}

checkData();

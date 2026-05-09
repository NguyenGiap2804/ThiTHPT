import { query, queryOne } from "./lib/database.js";

async function checkData() {
  try {
    const exams = await query('SELECT * FROM "Exams"');
    console.log("EXAMS COUNT:", exams.length);

    const questions = await query('SELECT * FROM "QuestionStructures"');
    console.log("QUESTIONS COUNT:", questions.length);

    const subjects = await query('SELECT * FROM "Subjects"');
    console.log("SUBJECTS COUNT:", subjects.length);

    const admin = await queryOne('SELECT id, name, email, role FROM "Users" WHERE id = $1', ['admin-001']);
    console.log("ADMIN SAMPLE:", admin);

    process.exit(0);
  } catch (err) {
    console.error("Check data failed:", err);
    process.exit(1);
  }
}

checkData();

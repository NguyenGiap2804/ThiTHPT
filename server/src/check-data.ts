import db from "./lib/database";

async function checkData() {
  try {
    const exams = await db.executeQuery("SELECT * FROM Exams");
    console.log("EXAMS:", exams);

    const questions = await db.executeQuery("SELECT * FROM QuestionStructures");
    console.log("QUESTIONS COUNT:", questions.length);

    const subjects = await db.executeQuery("SELECT * FROM Subjects");
    console.log("SUBJECTS COUNT:", subjects.length);

    const admin = await db.executeQuery("SELECT id, name, email, role FROM Users WHERE id = 'admin-001'");
    console.log("ADMIN SAMPLE:", admin[0]);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();

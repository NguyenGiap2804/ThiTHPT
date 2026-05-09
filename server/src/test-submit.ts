import { calculateAttemptScore, createAttemptWithAnswers } from "./lib/queries/attemptQueries.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

async function testSubmit() {
  const examId = "ex-1778367059993-pxgvs"; // From check-ids output
  const userId = "student-001";
  
  const answers = [
    { questionId: "ex-1778367059993-pxgvs-q1", selectedOption: "C" }
  ];

  console.log("Calculating score...");
  const scoringResult = await calculateAttemptScore(answers, examId);
  
  console.log("Scoring result details sample:", scoringResult.details[0]);

  console.log("Creating attempt...");
  const attemptId = uuidv4();
  try {
    const attempt = await createAttemptWithAnswers({
      id: attemptId,
      examId,
      userId,
      score: scoringResult.score,
      correctCount: scoringResult.correctCount,
      wrongCount: scoringResult.wrongCount,
      emptyCount: scoringResult.emptyCount,
      timeSpent: 100,
      details: scoringResult.details.map((answer) => ({
        ...answer,
        id: uuidv4(),
      })),
    });
    console.log("Success! Attempt ID:", attempt.id);
  } catch (err) {
    console.error("Submission failed!");
    console.error(err);
  }
}

testSubmit().catch(console.error);

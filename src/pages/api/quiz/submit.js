// src/pages/api/quiz/submit.js
// Submit quiz answers and calculate score

import { sql } from '@vercel/postgres';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, quizId, answers, timeTaken } = body;

    if (!walletAddress || !quizId || !answers) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user ID
    const { rows: users } = await sql`
      SELECT id FROM users
      WHERE wallet_address = ${walletAddress}
    `;

    const userId = users[0]?.id || null;

    // Get quiz details
    const { rows: quizRows } = await sql`
      SELECT total_questions, passing_score
      FROM training_quizzes
      WHERE id = ${quizId}
    `;

    if (quizRows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quiz not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quiz = quizRows[0];
    const passingScore = quiz.passing_score || 80;

    // Get all questions with correct answers
    const { rows: questions } = await sql`
      SELECT
        q.id as question_id,
        q.question_text,
        q.category,
        q.difficulty,
        q.explanation,
        ac.id as correct_choice_id,
        ac.choice_text as correct_answer
      FROM quiz_questions q
      LEFT JOIN quiz_answer_choices ac ON ac.question_id = q.id AND ac.is_correct = TRUE
      WHERE q.quiz_id = ${quizId}
        AND q.active = TRUE
    `;

    // Calculate score
    let correctAnswers = 0;
    const answerDetails = [];
    const categoryScores = {};

    questions.forEach(question => {
      const selectedChoiceId = answers[question.question_id];
      const isCorrect = selectedChoiceId === question.correct_choice_id;

      if (isCorrect) {
        correctAnswers++;
      }

      // Track category scores
      if (!categoryScores[question.category]) {
        categoryScores[question.category] = { correct: 0, total: 0 };
      }
      categoryScores[question.category].total++;
      if (isCorrect) {
        categoryScores[question.category].correct++;
      }

      answerDetails.push({
        questionId: question.question_id,
        questionText: question.question_text,
        category: question.category,
        selectedChoiceId: selectedChoiceId,
        correctChoiceId: question.correct_choice_id,
        isCorrect: isCorrect,
        explanation: question.explanation
      });
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = scorePercentage >= passingScore;

    // Create quiz attempt record
    const { rows: attemptRows } = await sql`
      INSERT INTO quiz_attempts (
        quiz_id,
        user_id,
        wallet_address,
        started_at,
        completed_at,
        time_taken_seconds,
        total_questions,
        correct_answers,
        score_percentage,
        passed,
        answers
      )
      VALUES (
        ${quizId},
        ${userId},
        ${walletAddress},
        NOW() - INTERVAL '${timeTaken} seconds',
        NOW(),
        ${timeTaken},
        ${totalQuestions},
        ${correctAnswers},
        ${scorePercentage},
        ${passed},
        ${JSON.stringify(answers)}
      )
      RETURNING id
    `;

    const attemptId = attemptRows[0].id;

    // Update user stats if passed
    if (passed && userId) {
      await sql`
        UPDATE user_stats
        SET
          quizzes_taken = quizzes_taken + 1,
          quiz_average_score = (
            (quiz_average_score * quizzes_taken + ${scorePercentage}) / (quizzes_taken + 1)
          ),
          certificates_earned = certificates_earned + 1,
          updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }

    // Prepare category breakdown
    const categoryBreakdown = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      correct: scores.correct,
      total: scores.total,
      percentage: Math.round((scores.correct / scores.total) * 100)
    }));

    return new Response(JSON.stringify({
      success: true,
      attemptId: attemptId,
      results: {
        correctCount: correctAnswers,
        totalQuestions: totalQuestions,
        percentage: scorePercentage,
        passed: passed,
        timeTaken: timeTaken,
        categoryBreakdown: categoryBreakdown
      },
      answerDetails: answerDetails
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

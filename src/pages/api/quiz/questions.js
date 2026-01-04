// src/pages/api/quiz/questions.js
// Get quiz questions with answer choices

import { sql } from '@vercel/postgres';

export async function GET({ url }) {
  try {
    const quizId = url.searchParams.get('quizId');

    if (!quizId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quiz ID required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get quiz questions
    const { rows: questions } = await sql`
      SELECT
        id,
        question_text,
        question_type,
        category,
        difficulty,
        points,
        explanation,
        order_index
      FROM quiz_questions
      WHERE quiz_id = ${quizId}
        AND active = TRUE
      ORDER BY order_index ASC, RANDOM()
    `;

    if (questions.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No questions found for this quiz'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get answer choices for each question
    const questionsWithChoices = await Promise.all(
      questions.map(async (question) => {
        const { rows: choices } = await sql`
          SELECT
            id,
            choice_text,
            is_correct,
            order_index
          FROM quiz_answer_choices
          WHERE question_id = ${question.id}
          ORDER BY order_index ASC
        `;

        // Don't send is_correct to frontend (prevent cheating)
        const choicesWithoutAnswer = choices.map(choice => ({
          id: choice.id,
          choice_text: choice.choice_text,
          order_index: choice.order_index
        }));

        return {
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          category: question.category,
          difficulty: question.difficulty,
          points: question.points,
          choices: choicesWithoutAnswer
          // Note: Don't send explanation until after submission
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      questions: questionsWithChoices,
      totalQuestions: questionsWithChoices.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

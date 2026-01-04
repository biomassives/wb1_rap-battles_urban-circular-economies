// src/pages/api/quiz/check-eligibility.js
// Check if user is eligible to take the quiz

import { sql } from '@vercel/postgres';

export async function GET({ url }) {
  try {
    const walletAddress = url.searchParams.get('walletAddress');
    const quizId = url.searchParams.get('quizId');

    if (!walletAddress || !quizId) {
      return new Response(JSON.stringify({
        eligible: false,
        message: 'Wallet address and quiz ID required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get quiz settings
    const { rows: quizRows } = await sql`
      SELECT max_attempts_per_day, cooldown_hours
      FROM training_quizzes
      WHERE id = ${quizId}
    `;

    if (quizRows.length === 0) {
      return new Response(JSON.stringify({
        eligible: false,
        message: 'Quiz not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quiz = quizRows[0];
    const maxAttemptsPerDay = quiz.max_attempts_per_day || 3;
    const cooldownHours = quiz.cooldown_hours || 4;

    // Check attempts today
    const { rows: attemptsToday } = await sql`
      SELECT COUNT(*) as attempt_count
      FROM quiz_attempts
      WHERE wallet_address = ${walletAddress}
        AND quiz_id = ${quizId}
        AND DATE(started_at) = CURRENT_DATE
    `;

    const attemptCount = parseInt(attemptsToday[0]?.attempt_count || 0);

    if (attemptCount >= maxAttemptsPerDay) {
      return new Response(JSON.stringify({
        eligible: false,
        message: `You've reached the maximum attempts (${maxAttemptsPerDay}) for today`,
        attemptsRemaining: 0,
        nextAttemptTime: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check cooldown period
    const { rows: lastAttempt } = await sql`
      SELECT started_at
      FROM quiz_attempts
      WHERE wallet_address = ${walletAddress}
        AND quiz_id = ${quizId}
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (lastAttempt.length > 0) {
      const lastAttemptTime = new Date(lastAttempt[0].started_at);
      const cooldownEnd = new Date(lastAttemptTime.getTime() + (cooldownHours * 60 * 60 * 1000));
      const now = new Date();

      if (now < cooldownEnd) {
        return new Response(JSON.stringify({
          eligible: false,
          message: `Please wait ${cooldownHours} hours between attempts`,
          attemptsRemaining: maxAttemptsPerDay - attemptCount,
          nextAttemptTime: cooldownEnd.toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // User is eligible
    return new Response(JSON.stringify({
      eligible: true,
      message: 'You can take the quiz',
      attemptsRemaining: maxAttemptsPerDay - attemptCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    return new Response(JSON.stringify({
      eligible: true, // Default to allowing attempt if check fails
      message: 'Error checking eligibility, but you may proceed',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

import { sql } from '../../lib/db.js';
export const prerender = false;

const VALID_ROLES = [
  'Artist/Rapper',
  'Beat Producer',
  'Judge/Voter',
  'Mentor/Teacher',
  'NFT Collector',
  'Impact Supporter',
  'Data Contributor',
  'DAO Governor'
];

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, role, walletAddress } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid role selected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (walletAddress && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid Solana wallet address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    await sql`
      CREATE TABLE IF NOT EXISTS email_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        desired_role VARCHAR(100),
        wallet_address VARCHAR(44),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const existing = await sql`SELECT id FROM email_signups WHERE email = ${email.trim().toLowerCase()}`;

    if (existing.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "You're already on the list! We'll notify you when testnet minting goes live.",
        alreadyRegistered: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await sql`
      INSERT INTO email_signups (email, desired_role, wallet_address)
      VALUES (${email.trim().toLowerCase()}, ${role || null}, ${walletAddress || null})
    `;

    return new Response(JSON.stringify({
      success: true,
      message: "You're on the list! We'll notify you when testnet minting goes live.",
      alreadyRegistered: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Signup error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

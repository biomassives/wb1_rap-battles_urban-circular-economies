/**
 * GET /api/reports/check-role?walletAddress=...
 * Returns user role and accessible report templates
 */

import { sql } from '../../../lib/db.js';
import { getTemplatesForRole } from '../../../lib/report-templates.js';

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false, error: 'walletAddress required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const users = await sql`
      SELECT role FROM user_profiles WHERE wallet_address = ${walletAddress}
    `;
    const role = users[0]?.role || 'member';
    const templates = getTemplatesForRole(role);

    return new Response(JSON.stringify({
      success: true,
      role,
      accessibleTemplates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
        sectionCount: t.sections.length,
        sections: t.sections.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          optional: s.optional,
          defaultEnabled: s.defaultEnabled
        }))
      }))
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({
      success: true,
      role: 'member',
      accessibleTemplates: [],
      error: error.message
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
